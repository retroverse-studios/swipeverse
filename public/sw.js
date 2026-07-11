const CACHE_NAME = 'swipeverse-v3';

// Never intercept AI provider traffic
const NEVER_CACHE = [
  'generativelanguage',
  'api.openai.com',
  'api.anthropic.com',
  'localhost:11434',
];

// Store catalog: fetch fresh when online, fall back to cache offline
const NETWORK_FIRST = [
  'retroverse-studios.github.io/swipeverse-store',
  'store.swipeverse.app',
];

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || NEVER_CACHE.some((h) => request.url.includes(h))) return;

  // Network-first for page navigations (new deploys arrive promptly) and the
  // store catalog (content updates arrive promptly); cache fallback offline.
  if (request.mode === 'navigate' || NETWORK_FIRST.some((h) => request.url.includes(h))) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Cache-first for everything else (hashed bundles, card art, fonts).
  event.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ||
        fetch(request).then((response) => {
          if (response && (response.ok || response.type === 'opaque')) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
    )
  );
});
