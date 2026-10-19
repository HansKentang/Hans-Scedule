/* Havën Schedule — Service Worker v3.0
   Strategy:
     - HTML navigations : network-first (always fresh), cache fallback when offline
     - Static assets    : stale-while-revalidate (instant repeat loads, refreshed in background)
     - Supabase API     : never intercepted
   Only a tiny shell is precached so install never competes with the first page load. */
const CACHE = 'haven-schedule-v52';
const OFFLINE_FALLBACK = './';

const SHELL = [
  './',
  'manifest.json',
  'assets/icon.svg',
  'assets/icon-192.png',
  'assets/icon-512.png'
];

const STATIC_RE = /\.(?:js|css|mjs|png|jpe?g|gif|webp|avif|svg|ico|woff2?|ttf|otf|json)$/i;

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((cache) => Promise.all(
        SHELL.map((u) => cache.add(u).catch(() => {}))
      ))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

function isSupabase(url) {
  return url.indexOf('.supabase.co') !== -1 || url.indexOf('.supabase.in') !== -1;
}

async function cachePut(request, response) {
  try {
    const cache = await caches.open(CACHE);
    await cache.put(request, response);
  } catch (err) { /* quota or opaque response — ignore */ }
}

/* Serve from cache instantly, refresh from network in the background. */
async function staleWhileRevalidate(event) {
  const request = event.request;
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);

  const network = fetch(request).then((res) => {
    if (res && res.ok && res.status === 200) cachePut(request, res.clone());
    return res;
  }).catch(() => null);

  if (cached) {
    event.waitUntil(network);
    return cached;
  }

  const fresh = await network;
  if (fresh) return fresh;

  return new Response('', { status: 504, statusText: 'Offline' });
}

/* Always try the network first so deploys show up immediately. */
async function networkFirst(event) {
  const request = event.request;
  try {
    const res = await fetch(request);
    if (res && res.ok && res.status === 200) cachePut(request, res.clone());
    return res;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate') {
      const fallback = await caches.match(OFFLINE_FALLBACK);
      if (fallback) return fallback;
    }
    throw err;
  }
}

self.addEventListener('fetch', (e) => {
  const request = e.request;
  if (request.method !== 'GET') return;

  const url = request.url;
  if (!url.startsWith('http')) return;
  if (isSupabase(url)) return;

  const parsed = new URL(url);
  if (parsed.origin !== self.location.origin) return;

  if (request.mode === 'navigate' || request.destination === 'document') {
    e.respondWith(networkFirst(e));
    return;
  }

  if (STATIC_RE.test(parsed.pathname)) {
    e.respondWith(staleWhileRevalidate(e));
    return;
  }

  e.respondWith(networkFirst(e));
});
