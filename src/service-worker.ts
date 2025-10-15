/// <reference lib="webworker" />

import { precacheAndRoute } from 'workbox-precaching';

type PrecacheEntry = string | { url: string; revision: string };

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<PrecacheEntry>;
};

// Enable precache only in production (not on localhost or 127.0.0.1)
const enablePrecache = !['localhost', '127.0.0.1'].includes(self.location.hostname);
const precacheManifest = self.__WB_MANIFEST;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

if (enablePrecache && Array.isArray(precacheManifest)) {
  precacheAndRoute(precacheManifest);
}

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url;
  if (targetUrl) {
    event.waitUntil(self.clients.openWindow(targetUrl));
  }
});
