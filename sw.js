// Include the installation path so separate previews on one origin have separate caches.
const CACHE_PREFIX = `ink-dropper:${self.registration.scope}:`;
const CACHE = `${CACHE_PREFIX}v2`;
const ASSETS = [
  './', './index.html', './manifest.webmanifest',
  './favicon.svg', './favicon.ico', './icons/favicon-32.png',
  './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png'
];
const ASSET_URLS = new Set(ASSETS.map(path => new URL(path, self.registration.scope).href));

self.addEventListener('install', e => {
  const requests = [...ASSET_URLS].map(url => new Request(url, { cache: 'reload' }));
  e.waitUntil(caches.open(CACHE).then(cache => cache.addAll(requests)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE).map(key => caches.delete(key))
    ))
      .then(() => self.clients.claim())
  );
});

// Serve the installed version as a unit. Bump CACHE when releasing new assets.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (e.request.mode === 'navigate') url.search = '';
  if (!ASSET_URLS.has(url.href)) return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(url.href);
    return cached || fetch(e.request);
  }));
});
