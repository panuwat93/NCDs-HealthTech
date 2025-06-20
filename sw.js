const CACHE_NAME = 'ncds-healthtech-cache-v2';
const URLS_TO_CACHE = [
    './',
    'index.html',
    'login.html',
    'register.html',
    'css/style.css',
    'js/main.js',
    'js/auth.js',
    'js/db.js',
    'js/NCDsData.js',
    'js/exerciseData.js',
    'js/foodData.js',
    'js/emergencyData.js',
    'images/icons/icon-192x192.png',
    'images/icons/icon-512x512.png',
    'https://www.smpkh.go.th/images/logo_smpk.png',
    'https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(URLS_TO_CACHE);
            })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});

self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
}); 