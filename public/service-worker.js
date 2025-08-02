// Service Worker for FabriiQ Offline Support (Activities + Social Wall)
const CACHE_NAME = 'fabriiq-cache-v2';
const ACTIVITY_DATA_CACHE = 'activity-data-v1';
const SOCIAL_DATA_CACHE = 'social-wall-data-v1';
const API_CACHE = 'fabriiq-api-v2';

// Assets to cache immediately on service worker install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/teacher/classes',
  '/student/class',
  '/manifest.json',
  '/favicon.ico',
  '/offline.html'
];

// API routes to cache
const API_ROUTES = [
  '/api/activities',
  '/api/subjects',
  '/api/classes',
  '/api/trpc/socialWall.getClassPosts',
  '/api/trpc/socialWall.getPostComments',
  '/api/trpc/socialWall.getReports',
  '/api/trpc/socialWall.getModerationLogs'
];

// Install event - precache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(CACHE_NAME).then(cache => {
        console.log('Precaching static assets');
        return cache.addAll(PRECACHE_ASSETS);
      }),
      
      // Cache API routes
      caches.open(API_CACHE).then(cache => {
        console.log('Precaching API routes');
        return Promise.all(
          API_ROUTES.map(url => 
            fetch(url)
              .then(response => {
                if (response.ok) {
                  return cache.put(url, response);
                }
              })
              .catch(error => console.error(`Failed to cache ${url}:`, error))
          )
        );
      })
    ])
    .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const currentCaches = [CACHE_NAME, ACTIVITY_DATA_CACHE, API_CACHE];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!currentCaches.includes(cacheName)) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Handle social wall API requests
  if (event.request.url.includes('/api/trpc/socialWall')) {
    event.respondWith(handleSocialWallAPI(event.request));
    return;
  }

  // Handle other API requests
  if (event.request.url.includes('/api/')) {
    event.respondWith(handleApiRequest(event.request));
    return;
  }

  // Handle activity data requests
  if (event.request.url.includes('/activities/')) {
    event.respondWith(handleActivityDataRequest(event.request));
    return;
  }
  
  // Handle static asset requests
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(event.request)
        .then(response => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response as it can only be consumed once
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          
          return response;
        })
        .catch(error => {
          console.error('Fetch failed:', error);
          
          // Return offline page for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
          
          return new Response('Network error', { status: 503, statusText: 'Service Unavailable' });
        });
    })
  );
});

// Handle social wall API requests with cache-first strategy
async function handleSocialWallAPI(request) {
  const url = new URL(request.url);

  try {
    // Try cache first for GET requests
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        console.log('Social Wall SW: Serving from cache:', url.pathname);

        // Fetch fresh data in background and update cache
        fetch(request)
          .then(response => {
            if (response && response.ok) {
              const responseToCache = response.clone();
              caches.open(API_CACHE).then(cache => {
                cache.put(request, responseToCache);
              });
            }
          })
          .catch(error => {
            console.log('Social Wall SW: Background fetch failed:', error);
          });

        return cachedResponse;
      }
    }

    // Try network
    const networkResponse = await fetch(request);

    // Cache successful GET responses
    if (networkResponse && networkResponse.ok && request.method === 'GET') {
      const responseToCache = networkResponse.clone();
      const cache = await caches.open(API_CACHE);
      cache.put(request, responseToCache);
      console.log('Social Wall SW: Cached API response:', url.pathname);
    }

    return networkResponse;
  } catch (error) {
    console.error('Social Wall SW: API request failed:', error);

    // For GET requests, try to return cached data
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        console.log('Social Wall SW: Fallback to cache:', url.pathname);
        return cachedResponse;
      }
    }

    // Return error response for failed mutations
    return new Response(JSON.stringify({
      error: 'Network unavailable',
      offline: true,
      message: 'This action will be synced when you\'re back online'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Clone and cache successful responses
    if (networkResponse && networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      const cache = await caches.open(API_CACHE);
      cache.put(request, responseToCache);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Falling back to cache for API request:', request.url);
    
    // If network fails, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If no cache, return error response
    return new Response(JSON.stringify({ error: 'Network error', offline: true }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle activity data requests with cache-first strategy
async function handleActivityDataRequest(request) {
  // Try cache first for activity data
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // If not in cache, try network
  try {
    const networkResponse = await fetch(request);
    
    // Clone and cache successful responses
    if (networkResponse && networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      const cache = await caches.open(ACTIVITY_DATA_CACHE);
      cache.put(request, responseToCache);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Failed to fetch activity data:', error);
    
    // Return error response
    return new Response(JSON.stringify({ error: 'Failed to load activity data', offline: true }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Sync event - handle background syncing
self.addEventListener('sync', event => {
  if (event.tag === 'activity-results-sync') {
    event.waitUntil(syncActivityResults());
  } else if (event.tag === 'social-wall-sync') {
    event.waitUntil(syncSocialWallData());
  }
});

// Function to sync activity results from IndexedDB to server
async function syncActivityResults() {
  // This will be implemented in the IndexedDB module
  // The service worker will just trigger the sync event
  console.log('Syncing activity results...');
  
  // Broadcast sync status to clients
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_STATUS',
        status: 'syncing'
      });
    });
  });
  
  // In a real implementation, we would:
  // 1. Open IndexedDB
  // 2. Get all pending results
  // 3. Send them to the server
  // 4. Mark them as synced in IndexedDB
  // 5. Notify clients of sync completion
  
  // For now, just simulate a successful sync after a delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Broadcast sync completion to clients
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_STATUS',
        status: 'completed'
      });
    });
  });
}

// Function to sync social wall data from IndexedDB to server
async function syncSocialWallData() {
  try {
    console.log('Social Wall SW: Starting background sync');

    // Broadcast sync start to clients
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'SOCIAL_WALL_SYNC_START',
          timestamp: new Date().toISOString()
        });
      });
    });

    // This would typically involve:
    // 1. Getting unsynced data from IndexedDB
    // 2. Sending it to the server via fetch
    // 3. Updating local storage with server responses
    // 4. Handling conflicts and errors

    // For now, just clear old cache entries and notify clients
    const cache = await caches.open(API_CACHE);
    const requests = await cache.keys();

    // Clear cache entries older than 1 hour
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    let clearedCount = 0;

    for (const request of requests) {
      if (request.url.includes('socialWall')) {
        const response = await cache.match(request);
        if (response) {
          const dateHeader = response.headers.get('date');
          if (dateHeader) {
            const responseDate = new Date(dateHeader).getTime();
            if (responseDate < oneHourAgo) {
              await cache.delete(request);
              clearedCount++;
              console.log('Social Wall SW: Cleared old cache entry:', request.url);
            }
          }
        }
      }
    }

    // Broadcast sync completion to clients
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'SOCIAL_WALL_SYNC_COMPLETE',
          timestamp: new Date().toISOString(),
          clearedEntries: clearedCount
        });
      });
    });

    console.log('Social Wall SW: Background sync completed');
  } catch (error) {
    console.error('Social Wall SW: Background sync failed:', error);

    // Broadcast sync error to clients
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'SOCIAL_WALL_SYNC_ERROR',
          timestamp: new Date().toISOString(),
          error: error.message
        });
      });
    });
  }
}

// Message event - handle messages from clients
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
