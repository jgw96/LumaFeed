import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Router } from '../src/router/router.js';
import type { RouteMatch } from '../src/router/router.js';

describe('Router', () => {
  let router: Router;
  let originalLocation: Location;
  let originalHistory: History;
  let originalNavigation: unknown;

  beforeEach(() => {
    // Store original location and history
    originalLocation = window.location;
    originalHistory = window.history;
    originalNavigation = (window as unknown as { navigation?: unknown }).navigation;

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
    const windowWithNavigation = window as typeof window & { navigation?: unknown };
    if (typeof originalNavigation === 'undefined') {
      delete windowWithNavigation.navigation;
    } else {
      windowWithNavigation.navigation = originalNavigation;
    }
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
    router = new Router([{ pattern: '/', component: 'home-page' }]);

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

  it('should use the Navigation API when available', async () => {
    const navigationEvents: Array<(event: NavigateEvent) => void> = [];
    const navigateMock = vi.fn((url: string) => {
      const controller = new AbortController();
      const event = {
        canIntercept: true,
        hashChange: false,
        downloadRequest: false,
        formData: null,
        navigationType: 'push' as const,
        destination: {
          url,
          getState: () => undefined,
        },
        signal: controller.signal,
        intercept: ({ handler }: { handler?: () => void | Promise<void> }) => {
          if (handler) {
            void handler();
          }
        },
      } satisfies NavigateEvent;

      navigationEvents.forEach((handler) => handler(event));

      return {
        committed: Promise.resolve({} as NavigationHistoryEntry),
        finished: Promise.resolve({} as NavigationHistoryEntry),
      };
    });
    const addEventListenerMock = vi.fn((_: 'navigate', handler: (event: NavigateEvent) => void) => {
      navigationEvents.push(handler);
    });

    Object.defineProperty(window, 'navigation', {
      configurable: true,
      writable: true,
      value: {
        addEventListener: addEventListenerMock,
        removeEventListener: vi.fn(),
        navigate: navigateMock,
      },
    });

    router = new Router([
      { pattern: '/', component: 'home-page' },
      { pattern: '/settings', component: 'settings-page' },
    ]);

    const routeChangePromise = new Promise<string>((resolve) => {
      let unsubscribe: (() => void) | undefined;
      unsubscribe = router.onRouteChange((route) => {
        if (route === 'settings-page') {
          unsubscribe?.();
          resolve(route);
        }
      });
    });

    router.navigate('/settings');

    const route = await routeChangePromise;
    const expectedUrl = new URL('/settings', window.location.origin).toString();

    expect(route).toBe('settings-page');
    expect(navigateMock).toHaveBeenCalledWith(expectedUrl);
    expect(addEventListenerMock).toHaveBeenCalledWith('navigate', expect.any(Function));
  });

  it('should save and restore scroll position on back navigation', async () => {
    router = new Router([
      { pattern: '/', component: 'home-page' },
      { pattern: '/settings', component: 'settings-page' },
    ]);

    // Mock scroll container
    const mockContainer = {
      scrollTop: 0,
    } as HTMLElement;

    router.setScrollContainer(() => mockContainer);

    // Navigate to settings and scroll down
    const waitForSettings = new Promise<void>((resolve) => {
      let unsubscribe: (() => void) | undefined;
      const listener = (route: string) => {
        if (route === 'settings-page') {
          unsubscribe?.();
          resolve();
        }
      };
      unsubscribe = router.onRouteChange(listener);
    });

    router.navigate('/settings');
    await waitForSettings;

    // Simulate scrolling on settings page
    await new Promise((resolve) => requestAnimationFrame(resolve));
    mockContainer.scrollTop = 500;

    // Navigate back to home
    const waitForHome = new Promise<void>((resolve) => {
      let unsubscribe: (() => void) | undefined;
      const listener = (route: string) => {
        if (route === 'home-page') {
          unsubscribe?.();
          resolve();
        }
      };
      unsubscribe = router.onRouteChange(listener);
    });

    router.navigate('/');
    await waitForHome;

    // Scroll should be reset for new navigation
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(mockContainer.scrollTop).toBe(0);

    // Navigate back to settings using popstate (simulating back button)
    const waitForSettingsAgain = new Promise<void>((resolve) => {
      let unsubscribe: (() => void) | undefined;
      const listener = (route: string) => {
        if (route === 'settings-page') {
          unsubscribe?.();
          resolve();
        }
      };
      unsubscribe = router.onRouteChange(listener);
    });

    // Manually set location to settings
    const settingsUrl = new URL('/settings', window.location.origin);
    Object.defineProperty(window, 'location', {
      writable: true,
      value: settingsUrl,
    });

    // Trigger popstate event
    window.dispatchEvent(new PopStateEvent('popstate'));
    await waitForSettingsAgain;

    // Scroll should be restored to saved position
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(mockContainer.scrollTop).toBe(500);
  });

  it('should reset scroll position for new navigation', async () => {
    router = new Router([
      { pattern: '/', component: 'home-page' },
      { pattern: '/settings', component: 'settings-page' },
    ]);

    const mockContainer = {
      scrollTop: 0,
    } as HTMLElement;

    router.setScrollContainer(() => mockContainer);

    // Set initial scroll position
    mockContainer.scrollTop = 300;

    // Navigate to a new page (push navigation)
    const waitForSettings = new Promise<void>((resolve) => {
      let unsubscribe: (() => void) | undefined;
      const listener = (route: string) => {
        if (route === 'settings-page') {
          unsubscribe?.();
          resolve();
        }
      };
      unsubscribe = router.onRouteChange(listener);
    });

    router.navigate('/settings');
    await waitForSettings;

    // Wait for scroll restoration
    await new Promise((resolve) => requestAnimationFrame(resolve));

    // Scroll should be reset to top for new navigation
    expect(mockContainer.scrollTop).toBe(0);
  });

  it('should handle missing scroll container gracefully', async () => {
    router = new Router([
      { pattern: '/', component: 'home-page' },
      { pattern: '/settings', component: 'settings-page' },
    ]);

    // Don't set scroll container
    const waitForSettings = new Promise<void>((resolve) => {
      let unsubscribe: (() => void) | undefined;
      const listener = (route: string) => {
        if (route === 'settings-page') {
          unsubscribe?.();
          resolve();
        }
      };
      unsubscribe = router.onRouteChange(listener);
    });

    // Should not throw even without scroll container
    router.navigate('/settings');
    await waitForSettings;

    expect(router.getCurrentRoute()).toBe('settings-page');
  });
});
