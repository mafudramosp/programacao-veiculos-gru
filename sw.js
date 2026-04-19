const CACHE = 'pvg-v6';
const STATIC = ['./manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // NEVER cache Google Scripts or APIs
  if (url.includes('script.google.com') || url.includes('googleapis.com') || url.includes('?')) {
    e.respondWith(fetch(e.request).catch(() => new Response('', {status: 408})));
    return;
  }

  // HTML files: always network-first so updates are seen immediately
  if (e.request.destination === 'document' || url.endsWith('.html') || url.endsWith('/')) {
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // Static assets (icons, manifest): cache-first
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
