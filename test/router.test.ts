import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Router } from '../src/router/router.js';
import type { RouteMatch } from '../src/router/router.js';

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
    const settingsLoader = vi.fn().mockResolvedValue(undefined);

    router = new Router([
      { pattern: '/', component: 'home-page' },
      { pattern: '/settings', component: 'settings-page', loader: settingsLoader },
    ]);

    expect(router).toBeDefined();
    expect(router.getCurrentRoute()).toBeTruthy();
  });

  it('should match home route', () => {
    router = new Router([
      { pattern: '/', component: 'home-page' },
      { pattern: '/settings', component: 'settings-page' },
    ]);

    const currentRoute = router.getCurrentRoute();
    expect(currentRoute).toBe('home-page');
  });

  it('should navigate to a new route', async () => {
    const settingsLoader = vi.fn().mockResolvedValue(undefined);

    router = new Router([
      { pattern: '/', component: 'home-page' },
      { pattern: '/settings', component: 'settings-page', loader: settingsLoader },
    ]);

    const routeChangePromise = new Promise<string>((resolve) => {
      let unsubscribe: (() => void) | undefined;
      const listener = (route: string) => {
        if (route === 'settings-page') {
          unsubscribe?.();
          resolve(route);
        }
      };

      unsubscribe = router.onRouteChange(listener);
    });

    router.navigate('/settings');

    const route = await routeChangePromise;
    expect(route).toBe('settings-page');
    expect(settingsLoader).toHaveBeenCalledTimes(1);
  });

  it('should not reload a component that has already been loaded', async () => {
    const settingsLoader = vi.fn().mockResolvedValue(undefined);

    router = new Router([
      { pattern: '/', component: 'home-page' },
      { pattern: '/settings', component: 'settings-page', loader: settingsLoader },
    ]);

    const waitForRoute = (expectedRoute: string) =>
      new Promise<void>((resolve) => {
        let unsubscribe: (() => void) | undefined;
        const listener = (route: string) => {
          if (route === expectedRoute) {
            unsubscribe?.();
            resolve();
          }
        };

        unsubscribe = router.onRouteChange(listener);
      });

    router.navigate('/settings');
    await waitForRoute('settings-page');

    router.navigate('/');
    await waitForRoute('home-page');

    router.navigate('/settings');
    await waitForRoute('settings-page');

    expect(settingsLoader).toHaveBeenCalledTimes(1);
  });

  it('should handle 404 for unknown routes', () => {
    router = new Router([
      { pattern: '/', component: 'home-page' },
      { pattern: '/settings', component: 'settings-page' },
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
      { pattern: '/settings', component: 'settings-page' },
    ]);

    expect(router.getCurrentRoute()).toBe('not-found-page');
  });

  it('should call route change listeners', async () => {
    router = new Router([
      { pattern: '/', component: 'home-page' },
      { pattern: '/settings', component: 'settings-page' },
    ]);

    const seenRoutes: string[] = [];
    const routeChangePromise = new Promise<void>((resolve) => {
      let unsubscribe: (() => void) | undefined;
      const listener = (route: string, params: RouteMatch) => {
        seenRoutes.push(route);
        expect(route).toBeTruthy();
        expect(params).toHaveProperty('pathname');
        expect(params).toHaveProperty('search');
        
        if (route === 'settings-page') {
          unsubscribe?.();
          resolve();
        }
      };

      unsubscribe = router.onRouteChange(listener);
    });

    router.navigate('/settings');

    await routeChangePromise;
    expect(seenRoutes[0]).toBe('home-page');
    expect(seenRoutes).toContain('settings-page');
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
    router.navigate('/settings');

    // Should still be 1 since we unsubscribed
    expect(callCount).toBe(1);
  });
});
