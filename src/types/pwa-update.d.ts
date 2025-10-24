// Custom event detail for service worker update flow
declare global {
  interface PWAUpdateAvailableDetail {
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
  }

  interface WindowEventMap {
    'pwa-update-available': CustomEvent<PWAUpdateAvailableDetail>;
  }

  interface HTMLElementEventMap {
    'pwa-update-dismissed': CustomEvent<void>;
    'pwa-update-applied': CustomEvent<void>;
  }
}

export {};
