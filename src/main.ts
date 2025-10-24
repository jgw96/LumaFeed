import { initializeTheme } from './utils/theme/apply-theme.js';

await initializeTheme();

await import('./app-root.js');

if ('serviceWorker' in navigator) {
  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        type: 'module',
        scope: '/',
      });

      // Check for updates on page load
      registration.update();

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker is available
              window.dispatchEvent(
                new CustomEvent('pwa-update-available', {
                  detail: {
                    updateServiceWorker: async () => {
                      // Tell the service worker to skip waiting
                      newWorker.postMessage({ type: 'SKIP_WAITING' });
                      
                      // When the new service worker takes control, reload the page
                      navigator.serviceWorker.addEventListener('controllerchange', () => {
                        window.location.reload();
                      });
                    },
                  },
                })
              );
            }
          });
        }
      });
    } catch (error) {
      console.warn('Service worker registration failed', error);
    }
  };

  if (document.readyState === 'complete') {
    void registerServiceWorker();
  } else {
    window.addEventListener(
      'load',
      () => {
        void registerServiceWorker();
      },
      { once: true }
    );
  }
}
