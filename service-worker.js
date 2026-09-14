/* Havën Schedule — Service Worker v2.0 */
const CACHE = 'haven-schedule-v31';
const URLS = [
  '/',
  '/index.html',
  '/schedule.html',
  '/progress.html',
  '/finance.html',
  '/gallery.html',
  '/goals.html',
  '/friends.html',
  '/login.html',
  '/landing.html',
  '/admin.html',
  '/privacy.html',
  '/terms.html',
  '/support.html',
  '/css/style.css',
  '/css/legal.css',
  '/css/progress-desert.css',
  '/css/progress-editorial.css',
  '/css/progress-mono.css',
  '/js/shared.js',
  '/js/settings.js',
  '/js/schedule.js',
  '/js/progress.js',
  '/js/finance.js',
  '/js/hub-visuals.js',
  '/js/gallery.js',
  '/js/goals.js',
  '/js/friends.js',
  '/js/firestore.js',
  '/js/firestore-sync.js',
  '/js/gsi.js',
  '/js/chat.js',
  '/js/chat-badge.js',
  '/js/admin.js',
  '/assets/icon.svg',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
  '/manifest.json'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(URLS))
  );
});

self.addEventListener('fetch', (e) => {
  // Skip Firestore / Firebase connections — they use WebSocket/long-polling
  // and must not be cached or intercepted by the service worker.
  var url = e.request.url;
  if (url.indexOf('firestore.googleapis.com') !== -1 ||
      url.indexOf('firebase.googleapis.com') !== -1 ||
      url.indexOf('googleapis.com/identitytoolkit') !== -1 ||
      url.indexOf('googleapis.com/securetoken') !== -1) {
    return;
  }
  if (e.request.method !== 'GET') return;
  e.respondWith((async () => {
    try {
      const res = await fetch(e.request);
      if (res && res.ok && new URL(e.request.url).origin === self.location.origin) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
      }
      return res;
    } catch (err) {
      const hit = await caches.match(e.request);
      if (hit) return hit;
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
