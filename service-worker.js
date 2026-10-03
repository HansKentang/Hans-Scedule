/* Havën Schedule — Service Worker v2.1 */
const CACHE = 'haven-schedule-v38';
const OFFLINE_FALLBACK = 'index.html';
const URLS = [
  './',
  'index.html',
  'schedule.html',
  'progress.html',
  'finance.html',
  'gallery.html',
  'goals.html',
  'friends.html',
  'rhythm.html',
  'login.html',
  'landing.html',
  'admin.html',
  'privacy.html',
  'terms.html',
  'support.html',
  'premium.html',
  'css/style.css',
  'css/legal.css',
  'css/progress-desert.css',
  'css/progress-editorial.css',
  'css/progress-mono.css',
  'js/shared.js',
  'js/settings.js',
  'js/schedule.js',
  'js/progress.js',
  'js/finance.js',
  'js/hub-visuals.js',
  'js/gallery.js',
  'js/goals.js',
  'js/friends.js',
  'js/supabase.js',
  'js/supabase-sync.js',
  'js/cloud-store.js',
  'js/gsi.js',
  'js/chat.js',
  'js/chat-badge.js',
  'js/premium-config.js',
  'js/premium.js',
  'js/admin.js',
  'assets/icon.svg',
  'assets/icon-192.png',
  'assets/icon-512.png',
  'manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('fetch', (e) => {
  var url = e.request.url;
  if (url.indexOf('.supabase.co') !== -1 || url.indexOf('.supabase.in') !== -1) {
    return;
  }
  if (e.request.method !== 'GET') return;
  e.respondWith((async () => {
    try {
      const res = await fetch(e.request);
      const isPartial = res.status === 206 || e.request.headers.has('range');
      if (res && res.ok && !isPartial && new URL(e.request.url).origin === self.location.origin) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
      }
      return res;
    } catch (err) {
      const hit = await caches.match(e.request);
      if (hit) return hit;
      if (e.request.mode === 'navigate') {
        const fallback = await caches.match(OFFLINE_FALLBACK);
        if (fallback) return fallback;
      }
      throw err;
    }
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});
