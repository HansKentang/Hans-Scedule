/* Havën Schedule — Service Worker v2.0 */
const CACHE = 'haven-schedule-v2';
const URLS = [
  '/',
  '/index.html',
  '/schedule.html',
  '/activities.html',
  '/tags.html',
  '/analytics.html',
  '/finance.html',
  '/gallery.html',
  '/style.css',
  '/shared.js',
  '/schedule.js',
  '/activities.js',
  '/tags.js',
  '/analytics.js',
  '/finance.js',
  '/hub-visuals.js',
  '/gallery.js',
  '/icon.svg',
  '/manifest.json',
  '/goals.html',
  '/goals.js'
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
