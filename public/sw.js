// Service Worker for caching static assets
const CACHE_NAME = 'ovqat-ai-v1';
const STATIC_ASSETS = [
  // Icons
  '/assets/icons/chevron-left.svg',
  '/assets/icons/upload-line.svg',
  '/assets/icons/minus.svg',
  '/assets/icons/plus.svg',
  
  // Images - Macros
  '/assets/img/calories.png',
  '/assets/img/health-score.png',
  '/assets/img/protein.png',
  '/assets/img/carbs.png',
  '/assets/img/fat.png',
  '/assets/img/fiber.png',
  
  // Images - Questionnaire icons (add more as needed)
  '/assets/img/fitness-1.png',
  '/assets/img/fitness-2.png',
  '/assets/img/fitness-3.png',
  '/assets/img/fitness-4.png',
  '/assets/img/fitness-5.png',
  
  // Fonts (if you have them in public)
  // '/assets/fonts/YourFont.woff2',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only cache GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip API requests (Supabase, OpenAI, etc.)
  if (
    url.hostname.includes('supabase') ||
    url.hostname.includes('openai') ||
    url.pathname.startsWith('/api/')
  ) {
    return;
  }

  // Cache-first strategy for static assets
  if (
    url.pathname.startsWith('/assets/') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.woff2')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          console.log('[SW] Serving from cache:', url.pathname);
          return cachedResponse;
        }
        console.log('[SW] Fetching from network:', url.pathname);
        return fetch(request).then((response) => {
          // Cache the new resource
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
  }
});
