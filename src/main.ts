import { initializeTheme } from './utils/theme/apply-theme.js';

await initializeTheme();

await import('./app-root.js');

if ('serviceWorker' in navigator) {
  const registerServiceWorker = async () => {
    try {
      const { registerSW } = await import('virtual:pwa-register');
      const updateSW = registerSW({
        immediate: true,
        onNeedRefresh() {
          window.dispatchEvent(
            new CustomEvent('pwa-update-available', {
              detail: { updateServiceWorker: updateSW },
            })
          );
        },
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
