/// <reference lib="webworker" />

import { registerRoute, NavigationRoute } from 'workbox-routing';
import { 
  NetworkFirst, 
  CacheFirst 
} from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';

declare const self: ServiceWorkerGlobalScope;

const CACHE_VERSION = 'v1';
const ASSETS_CACHE = `assets-${CACHE_VERSION}`;
const PAGES_CACHE = `pages-${CACHE_VERSION}`;
const IMAGES_CACHE = `images-${CACHE_VERSION}`;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter(cacheName => 
            cacheName.startsWith('assets-') ||
            cacheName.startsWith('pages-') ||
            cacheName.startsWith('images-')
          )
          .filter(cacheName => 
            cacheName !== ASSETS_CACHE &&
            cacheName !== PAGES_CACHE &&
            cacheName !== IMAGES_CACHE
          )
          .map(cacheName => caches.delete(cacheName))
      );
      await self.clients.claim();
    })()
  );
});

// Cache JavaScript and CSS files with CacheFirst strategy
registerRoute(
  ({ request }) => 
    request.destination === 'script' || 
    request.destination === 'style',
  new CacheFirst({
    cacheName: ASSETS_CACHE,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// Cache images with CacheFirst strategy
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: IMAGES_CACHE,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// Handle navigation requests with NetworkFirst strategy
const navigationHandler = new NetworkFirst({
  cacheName: PAGES_CACHE,
  plugins: [
    new CacheableResponsePlugin({
      statuses: [0, 200],
    }),
  ],
});

const navigationRoute = new NavigationRoute(navigationHandler, {
  denylist: [new RegExp('^/_'), new RegExp('/[^/?]+\\.[^/]+$')],
});

registerRoute(navigationRoute);

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const rawTargetUrl: unknown = event.notification?.data?.url;
      const normalizedTargetUrl =
        typeof rawTargetUrl === 'string' && rawTargetUrl
          ? new URL(rawTargetUrl, self.location.origin).href
          : undefined;

      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });

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

      const fallbackUrl = normalizedTargetUrl ?? self.registration.scope;
      if (fallbackUrl) {
        return self.clients.openWindow(fallbackUrl);
      }
    })()
  );
});
