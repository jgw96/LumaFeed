/// <reference lib="webworker" />

import {
  precacheAndRoute,
  createHandlerBoundToURL,
  cleanupOutdatedCaches,
} from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';

type PrecacheEntry = string | { url: string; revision: string };

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<PrecacheEntry>;
};

const devServerHost = '5173';
const isLocalDevServer =
  ['localhost', '127.0.0.1'].includes(self.location.hostname) &&
  self.location.port === devServerHost;
const enablePrecache = !isLocalDevServer;
const precacheManifest = self.__WB_MANIFEST;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

if (enablePrecache && Array.isArray(precacheManifest)) {
  cleanupOutdatedCaches();
  precacheAndRoute(precacheManifest);

  // Provide SPA-style navigation fallback to the app shell while offline.
  const navigationHandler = createHandlerBoundToURL('/index.html');
  const navigationRoute = new NavigationRoute(navigationHandler, {
    denylist: [new RegExp('^/_'), new RegExp('/[^/?]+\\.[^/]+$')],
  });

  registerRoute(navigationRoute);
}

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
