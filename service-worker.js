/* Havën Schedule — Service Worker v2.0 */
const CACHE = 'haven-schedule-v5';
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
  '/css/style.css',
  '/js/shared.js',
  '/js/schedule.js',
  '/js/activities.js',
  '/js/tags.js',
  '/js/analytics.js',
  '/js/finance.js',
  '/js/hub-visuals.js',
  '/js/gallery.js',
  '/js/goals.js',
  '/js/friends.js',
  '/js/firestore.js',
  '/js/gsi.js',
  '/js/chat.js',
  '/js/chat-badge.js',
  '/assets/icon.svg',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
  '/manifest.json'
];

self.addEventListener('install', (e) => {
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
