/// <reference lib="webworker" />

// Type assertion to ensure we're in a Service Worker context
const sw = self as unknown as ServiceWorkerGlobalScope;

const CACHE_VERSION = 'v1';
const ASSETS_CACHE = `assets-${CACHE_VERSION}`;
const PAGES_CACHE = `pages-${CACHE_VERSION}`;
const IMAGES_CACHE = `images-${CACHE_VERSION}`;

// Cache configuration
const CACHE_CONFIG = {
  assets: {
    maxEntries: 60,
    maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
  },
  images: {
    maxEntries: 60,
    maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
  },
};

sw.addEventListener('install', () => {
  sw.skipWaiting();
});

sw.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter(
            (cacheName) =>
              cacheName.startsWith('assets-') ||
              cacheName.startsWith('pages-') ||
              cacheName.startsWith('images-')
          )
          .filter(
            (cacheName) =>
              cacheName !== ASSETS_CACHE && cacheName !== PAGES_CACHE && cacheName !== IMAGES_CACHE
          )
          .map((cacheName) => caches.delete(cacheName))
      );
      await sw.clients.claim();
    })()
  );
});

// Handle messages from clients
sw.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    sw.skipWaiting();
  }
});

/**
 * Check if response is cacheable (status 0 or 200)
 */
function isCacheableResponse(response: Response): boolean {
  return response.status === 0 || response.status === 200;
}

/**
 * Trim cache to max entries by removing oldest entries
 */
async function trimCache(cacheName: string, maxEntries: number): Promise<void> {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length > maxEntries) {
    // Remove oldest entries (first in the list)
    const entriesToDelete = keys.slice(0, keys.length - maxEntries);
    await Promise.all(entriesToDelete.map((key) => cache.delete(key)));
  }
}

/**
 * Cache First strategy: Check cache first, fall back to network
 */
async function cacheFirst(
  request: Request,
  cacheName: string,
  config: { maxEntries: number; maxAgeSeconds: number }
): Promise<Response> {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    // Check if cached response is expired
    const dateHeader = cachedResponse.headers.get('date');
    if (dateHeader) {
      const cacheDate = new Date(dateHeader).getTime();
      const now = Date.now();
      const age = (now - cacheDate) / 1000; // age in seconds

      if (age > config.maxAgeSeconds) {
        // Cache expired, delete and fetch from network
        await cache.delete(request);
      } else {
        return cachedResponse;
      }
    } else {
      return cachedResponse;
    }
  }

  // Fetch from network
  const response = await fetch(request);

  // Cache if response is cacheable
  if (isCacheableResponse(response)) {
    cache.put(request, response.clone());
    // Trim cache to max entries
    await trimCache(cacheName, config.maxEntries);
  }

  return response;
}

/**
 * Network First strategy: Try network first, fall back to cache
 */
async function networkFirst(request: Request, cacheName: string): Promise<Response> {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);

    // Cache if response is cacheable
    if (isCacheableResponse(response)) {
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    throw error;
  }
}

/**
 * Check if request is a navigation request
 */
function isNavigationRequest(request: Request): boolean {
  return (
    request.mode === 'navigate' ||
    (request.method === 'GET' && (request.headers.get('accept')?.includes('text/html') ?? false))
  );
}

/**
 * Check if navigation request should be excluded from caching
 */
function isNavigationDenylisted(url: URL): boolean {
  // Exclude paths starting with /_
  if (url.pathname.startsWith('/_')) {
    return true;
  }

  // Exclude paths that look like file extensions (e.g., /file.ext)
  const hasFileExtension = /\/[^/?]+\.[^/]+$/.test(url.pathname);
  return hasFileExtension;
}

// Fetch event handler
sw.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle requests from same origin
  if (url.origin !== sw.location.origin) {
    return;
  }

  // Handle navigation requests with NetworkFirst
  if (isNavigationRequest(request) && !isNavigationDenylisted(url)) {
    event.respondWith(networkFirst(request, PAGES_CACHE));
    return;
  }

  // Handle scripts and styles with CacheFirst
  if (request.destination === 'script' || request.destination === 'style') {
    event.respondWith(cacheFirst(request, ASSETS_CACHE, CACHE_CONFIG.assets));
    return;
  }

  // Handle images with CacheFirst
  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request, IMAGES_CACHE, CACHE_CONFIG.images));
    return;
  }
});

sw.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const rawTargetUrl: unknown = event.notification?.data?.url;
      const normalizedTargetUrl =
        typeof rawTargetUrl === 'string' && rawTargetUrl
          ? new URL(rawTargetUrl, sw.location.origin).href
          : undefined;

      const clients = await sw.clients.matchAll({ type: 'window', includeUncontrolled: true });

      for (const client of clients) {
        if (normalizedTargetUrl && client.url === normalizedTargetUrl) {
          if ('focus' in client) {
            return client.focus();
          }
          return;
        }
      }

      if (clients.length > 0) {
        const [client] = clients;
        if ('focus' in client) {
          return client.focus();
        }
        return;
      }

      const fallbackUrl = normalizedTargetUrl ?? sw.registration.scope;
      if (fallbackUrl) {
        return sw.clients.openWindow(fallbackUrl);
      }
    })()
  );
});
