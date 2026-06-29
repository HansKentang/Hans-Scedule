/* Havën Schedule — Service Worker v2.0 */
const CACHE = 'haven-schedule-v4';
const URLS = [
  '/',
  '/index.html',
  '/schedule.html',
  '/activities.html',
  '/tags.html',
  '/analytics.html',
  '/finance.html',
  '/gallery.html',
  '/goals.html',
  '/friends.html',
  '/login.html',
  '/style.css',
  '/shared.js',
  '/schedule.js',
  '/activities.js',
  '/tags.js',
  '/analytics.js',
  '/finance.js',
  '/hub-visuals.js',
  '/gallery.js',
  '/goals.js',
  '/friends.js',
  '/firestore.js',
  '/gsi.js',
  '/chat.js',
  '/chat-badge.js',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(URLS))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
    ))
  );
});
