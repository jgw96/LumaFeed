import './app-root.js';

if ('serviceWorker' in navigator) {
	window.addEventListener('load', async () => {
		try {
			const { registerSW } = await import('virtual:pwa-register');
			registerSW({ 
				immediate: true,
			});
		} catch (error) {
			console.warn('Service worker registration failed', error);
		}
	});
}
