// Service Worker for caching and offline functionality
const STATIC_CACHE = 'riocut-static-v1'
const DYNAMIC_CACHE = 'riocut-dynamic-v1'

// Resources to cache immediately
const STATIC_ASSETS = [
    '/',
    '/manifest.json',
    '/favicon.ico',
    '/offline.html',
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...')
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => {
            return cache.addAll(STATIC_ASSETS)
        })
    )
    // Force activation
    self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...')
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((cacheName) => cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE)
                    .map((cacheName) => caches.delete(cacheName))
            )
        })
    )
    // Take control of all clients
    self.clients.claim()
})

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
    const { request } = event
    const url = new URL(request.url)

    // Skip non-GET requests
    if (request.method !== 'GET') return

    // Skip external requests (TMDB API, etc.)
    if (!url.origin.includes(self.location.origin)) return

    // Skip API routes (they need fresh data)
    if (url.pathname.startsWith('/api/')) return

    // Handle navigation requests
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Cache successful responses
                    if (response.ok) {
                        const responseClone = response.clone()
                        caches.open(DYNAMIC_CACHE).then((cache) => {
                            cache.put(request, responseClone)
                        })
                    }
                    return response
                })
                .catch(() => {
                    // Return cached version or offline page
                    return caches.match(request).then((cachedResponse) => {
                        return cachedResponse || caches.match('/offline.html')
                    })
                })
        )
        return
    }

    // Handle static assets
    if (STATIC_ASSETS.includes(url.pathname) || url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/)) {
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                return cachedResponse || fetch(request).then((response) => {
                    // Cache the response
                    const responseClone = response.clone()
                    caches.open(STATIC_CACHE).then((cache) => {
                        cache.put(request, responseClone)
                    })
                    return response
                })
            })
        )
        return
    }

    // Default: Network first for dynamic content
    event.respondWith(
        fetch(request)
            .then((response) => {
                // Cache successful responses
                if (response.ok) {
                    const responseClone = response.clone()
                    caches.open(DYNAMIC_CACHE).then((cache) => {
                        cache.put(request, responseClone)
                    })
                }
                return response
            })
            .catch(() => {
                // Return cached version
                return caches.match(request)
            })
    )
})

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    console.log('Service Worker: Background sync', event.tag)

    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync())
    }
})

async function doBackgroundSync() {
    // Handle offline actions like adding to watchlist
    // This would typically sync localStorage changes when back online
    console.log('Performing background sync...')
}

// Push notifications (if implemented later)
self.addEventListener('push', (event) => {
    console.log('Service Worker: Push received', event)

    if (event.data) {
        const data = event.data.json()
        const options = {
            body: data.body,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                primaryKey: 1,
            },
        }

        event.waitUntil(
            self.registration.showNotification(data.title, options)
        )
    }
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    console.log('Service Worker: Notification click', event)
    event.notification.close()

    event.waitUntil(
        self.clients.openWindow(event.notification.data.url || '/')
    )
})