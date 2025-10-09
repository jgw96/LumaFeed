import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Router } from '../src/router/router.js';

describe('Router', () => {
  let router: Router;
  let originalLocation: Location;
  let originalHistory: History;

  beforeEach(() => {
    // Store original location and history
    originalLocation = window.location;
    originalHistory = window.history;
    
    // Mock history.pushState
    window.history.pushState = (data: any, unused: string, url?: string | URL | null) => {
      if (url) {
        const newUrl = new URL(url, window.location.origin);
        Object.defineProperty(window, 'location', {
          writable: true,
          value: newUrl,
        });
      }
    };
  });

  afterEach(() => {
    // Restore original location and history
    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    });
    Object.defineProperty(window, 'history', {
      writable: true,
      value: originalHistory,
    });
  });

  it('should initialize with routes', () => {
    router = new Router([
      { pattern: '/', component: 'home-page' },
      { pattern: '/about', component: 'about-page' },
    ]);

    expect(router).toBeDefined();
    expect(router.getCurrentRoute()).toBeTruthy();
  });

  it('should match home route', () => {
    router = new Router([
      { pattern: '/', component: 'home-page' },
      { pattern: '/about', component: 'about-page' },
    ]);

    const currentRoute = router.getCurrentRoute();
    expect(currentRoute).toBe('home-page');
  });

  it('should navigate to a new route', async () => {
    router = new Router([
      { pattern: '/', component: 'home-page' },
      { pattern: '/about', component: 'about-page' },
    ]);

    const routeChangePromise = new Promise<string>((resolve) => {
      router.onRouteChange((route) => {
        if (route === 'about-page') {
          resolve(route);
        }
      });
    });

    router.navigate('/about');

    const route = await routeChangePromise;
    expect(route).toBe('about-page');
  });

  it('should handle 404 for unknown routes', () => {
    router = new Router([
      { pattern: '/', component: 'home-page' },
      { pattern: '/about', component: 'about-page' },
    ]);

    // Manually set location to an unknown path
    const unknownUrl = new URL('/unknown', window.location.origin);
    Object.defineProperty(window, 'location', {
      writable: true,
      value: unknownUrl,
    });

    // Create a new router instance with the unknown path
    router = new Router([
      { pattern: '/', component: 'home-page' },
      { pattern: '/about', component: 'about-page' },
    ]);

    expect(router.getCurrentRoute()).toBe('not-found');
  });

  it('should call route change listeners', async () => {
    router = new Router([
      { pattern: '/', component: 'home-page' },
      { pattern: '/about', component: 'about-page' },
    ]);

    let callCount = 0;
    const routeChangePromise = new Promise<void>((resolve) => {
      router.onRouteChange((route, params) => {
        callCount++;
        expect(route).toBeTruthy();
        expect(params).toHaveProperty('pathname');
        expect(params).toHaveProperty('search');
        
        if (callCount === 2) {
          resolve();
        }
      });
    });

    router.navigate('/about');

    await routeChangePromise;
    expect(callCount).toBe(2);
  });

  it('should allow unsubscribing from route changes', () => {
    router = new Router([
      { pattern: '/', component: 'home-page' },
    ]);

    let callCount = 0;
    const unsubscribe = router.onRouteChange(() => {
      callCount++;
    });

    expect(callCount).toBe(1); // Called immediately

    unsubscribe();
    router.navigate('/about');

    // Should still be 1 since we unsubscribed
    expect(callCount).toBe(1);
  });
});
