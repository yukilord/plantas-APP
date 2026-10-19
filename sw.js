const CACHE = 'herbanario-v3';

// Tem de corresponder ao que o index.html carrega
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/base.css',
  './css/main.css',
  './js/api.js',
  './js/components/header.js',
  './js/components/feed.js',
  './js/app.js'
];

// Guarda cada ficheiro à parte: se um faltar, os outros ficam na mesma em cache
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.allSettled(ASSETS.map((url) => cache.add(url)))
    )
  );
  self.skipWaiting();
});

// Apaga caches de versões antigas
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Rede primeiro (apanha sempre a versão nova); sem rede usa a cache
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok && new URL(e.request.url).origin === location.origin) {
          const copia = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copia));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html')))
  );
});