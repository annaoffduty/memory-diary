// Minimal service worker so the app is installable and works offline
// once the shell has been visited at least once.
const CACHE_NAME = 'thread-diary-v2';
const APP_SHELL = [
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Network-first so the app shell stays fresh (cache-first was serving a
  // stale index.html, hiding new code). Falls back to cache when offline.
  event.respondWith(
    fetch(event.request)
      .then((resp) => {
        if (event.request.method === 'GET' && resp && resp.ok &&
            new URL(event.request.url).origin === self.location.origin) {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return resp;
      })
      .catch(() => caches.match(event.request))
  );
});
