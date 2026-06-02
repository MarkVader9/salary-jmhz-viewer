/* Service Worker – JMHZ Viewer (offline-first, statický provoz z FTP) */
const CACHE = 'jmhz-viewer-v2';
const CORE = [
  './',
  './index.html',
  './manifest.js',
  './app.webmanifest',
  './icon.svg',
  './data/zpravy.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE).catch(() => {})));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (req.headers.has('range')) return; // video/audio (Range) ponecháme prohlížeči
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // externí zdroje neřešíme

  // Navigace: nejdřív síť (čerstvý obsah), offline fallback z cache
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('./index.html')))
    );
    return;
  }

  // Ostatní GET: stale-while-revalidate (rychlé načtení + aktualizace na pozadí)
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
