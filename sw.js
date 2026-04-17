const CACHE = 'pvg-v5';
const STATIC = ['./', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  // Delete all old caches
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  // NEVER cache: Google Scripts, APIs, or dynamic requests
  if (url.includes('script.google.com') || 
      url.includes('googleapis.com') ||
      url.includes('?') ) {
    e.respondWith(fetch(e.request));
    return;
  }
  // Cache-first only for truly static assets (no query string)
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
