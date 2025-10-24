// Custom event detail for service worker update flow
declare global {
  interface PWAUpdateAvailableDetail {
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
  }

  interface WindowEventMap {
    'pwa-update-available': CustomEvent<PWAUpdateAvailableDetail>;
  }
}

export {};
