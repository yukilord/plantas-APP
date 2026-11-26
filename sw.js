const CACHE = 'herbanario-v28';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './js/firebase-config.js',
  './css/base.css',
  './css/main.css',
  './js/api.js',
  './assets/google-g-logo.png',
  './js/components/header.js',
  './js/components/feed.js',
  './js/app.js'
];

// Bibliotecas externas que a app precisa para abrir sem internet.
const EXTERNOS = [
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore-compat.js'
];
const HOSTS_EXTERNOS = ['www.gstatic.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => Promise.allSettled([...ASSETS, ...EXTERNOS].map((url) => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith('herbanario-') && key !== CACHE)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const sameOrigin = url.origin === location.origin;

  // Firebase SDK e fontes: usa a cópia guardada e atualiza-a em segundo plano.
  if (!sameOrigin && HOSTS_EXTERNOS.includes(url.hostname)) {
    if (url.hostname === 'www.gstatic.com' && !url.pathname.startsWith('/firebasejs/')) return;
    event.respondWith(
      caches.open(CACHE).then((cache) => cache.match(event.request).then((cached) => {
        const rede = fetch(event.request)
          .then((response) => {
            if (response && (response.ok || response.type === 'opaque')) cache.put(event.request, response.clone());
            return response;
          })
          .catch(() => cached);
        return cached || rede;
      }))
    );
    return;
  }

  // Outros domínios (Firestore, login Google, fotos) e os caminhos /__/ do
  // Firebase Authentication seguem sempre pela rede.
  if (!sameOrigin || url.pathname.startsWith('/__/')) return;

  // Ficheiros da app: rede primeiro; sem rede, usa a cache.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => {
        if (cached) return cached;
        // Só as páginas recebem o index.html; scripts e imagens em falta dão erro normal.
        if (event.request.mode === 'navigate') return caches.match('./index.html');
        return Response.error();
      }))
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
