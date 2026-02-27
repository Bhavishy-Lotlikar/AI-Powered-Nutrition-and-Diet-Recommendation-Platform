/**
 * NurtiMind Service Worker (Stub)
 * Ready for future PWA conversion with caching strategies.
 */

const CACHE_NAME = 'nurtimind-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/app.js',
    '/js/api.js',
    '/js/camera.js',
    '/js/imageUpload.js',
    '/manifest.json',
];

// Install: cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// Fetch: network-first for API, cache-first for static
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Always go to network for API calls
    if (request.url.includes('/analyze-image') || request.url.includes('/api/')) {
        event.respondWith(fetch(request));
        return;
    }

    // Cache-first for static assets
    event.respondWith(
        caches.match(request).then((cached) => {
            return cached || fetch(request).then((response) => {
                const clone = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                return response;
            });
        })
    );
});
