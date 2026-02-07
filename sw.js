const V = 'v87';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.map(k => caches.delete(k))
        )).then(() => self.clients.claim())
    );
});
self.addEventListener('fetch', e => {
    // Network-first: sempre tenta buscar da rede
    e.respondWith(
        fetch(e.request).catch(() => caches.match(e.request))
    );
});
