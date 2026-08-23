// Service worker offline-first per BraBa Prüftool.
// Strategie: cache-first mit Runtime-Caching — jede angeforderte Datei
// (JS/CSS-Bundles, PDF-Vorlage, Icons) wird beim ersten Laden automatisch
// zwischengespeichert und danach auch ohne Internetverbindung geladen.

const CACHE_NAME = 'braba-prueftool-1787480733913';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/wallbox-template.pdf',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
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
  const { request } = event;
  if (request.method !== 'GET') return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);

      // Bundles/Assets: sofort aus Cache falls vorhanden (schnell, offline-fähig).
      // Navigation (HTML): Netzwerk bevorzugen, damit Updates ankommen, mit Cache-Fallback.
      if (request.mode === 'navigate') {
        return networkFetch;
      }
      return cached || networkFetch;
    })
  );
});
