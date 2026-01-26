const CACHE_NAME = 'centric-fit-v2'
const STATIC_CACHE = 'centric-fit-static-v2'

// Basic files to cache
const STATIC_ASSETS = [
  '/',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/offline'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip API calls, auth callbacks, dynamic content, and external resources
  if (
    request.url.includes('/api/') ||
    request.url.includes('/auth/') ||
    request.url.includes('/dashboard') ||
    request.url.includes('/profile') ||
    request.url.includes('supabase.co') ||
    request.url.includes('googleusercontent.com') ||
    request.url.includes('razorpay.com') ||
    request.url.includes('_rsc=') ||  // Next.js RSC
    request.url.includes('?') ||     // Skip URLs with query params
    request.url.includes('#')        // Skip hash URLs
  ) return

  // Only cache static assets with specific extensions
  const isStaticAsset = /\.(css|js|png|jpg|jpeg|svg|ico|woff|woff2)$/i.test(request.url)
  
  if (!isStaticAsset) return

  // Cache first for static assets only
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) return cachedResponse

        return fetch(request).then((response) => {
          if (response.ok) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
      })
  )
})
