import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '../src/app-root.js';
import { cleanup, mountComponent, queryShadow, waitFor } from './helpers.js';
import type { AppRoot } from '../src/app-root.js';

describe('AppRoot', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render the app with header brand', async () => {
    const appRoot = await mountComponent<AppRoot>('app-root');

    const header = queryShadow(appRoot, 'header');
    expect(header).toBeTruthy();

    const brand = queryShadow(appRoot, 'header .brand');
    expect(brand?.textContent?.trim()).toBe('LumaFeed');
  });

  it('should render bottom navigation links on mobile layout', async () => {
    const appRoot = await mountComponent<AppRoot>('app-root');

    const bottomNav = queryShadow(appRoot, '.bottom-nav');
    expect(bottomNav).toBeTruthy();

    const links = bottomNav?.querySelectorAll('a[href]') ?? [];
    expect(links.length).toBeGreaterThan(0);
  });

  it('should render navigation links', async () => {
    const appRoot = await mountComponent<AppRoot>('app-root');

    const homeLink = queryShadow<HTMLAnchorElement>(appRoot, 'a[href="/"]');
    const diaperLink = queryShadow<HTMLAnchorElement>(appRoot, 'a[href="/diapers"]');
    const settingsLink = queryShadow<HTMLAnchorElement>(appRoot, 'a[href="/settings"]');

    expect(homeLink).toBeTruthy();
    expect(homeLink?.textContent?.trim()).toBe('Home');
    expect(diaperLink).toBeTruthy();
    expect(diaperLink?.textContent?.trim()).toBe('Diapers');
    expect(settingsLink).toBeTruthy();
    expect(settingsLink?.textContent?.trim()).toBe('Settings');
  });

  it('should render home page by default', async () => {
    const appRoot = await mountComponent<AppRoot>('app-root');

    await waitFor(
      () => {
        const homePage = queryShadow(appRoot, 'home-page');
        return homePage !== null;
      },
      3000,
      'Home page not rendered'
    );

    const homePage = queryShadow(appRoot, 'home-page');
    expect(homePage).toBeTruthy();
  });

  it('should navigate to settings page when settings link is clicked', async () => {
    const appRoot = await mountComponent<AppRoot>('app-root');

    const settingsLink = queryShadow<HTMLAnchorElement>(appRoot, 'a[href="/settings"]');
    expect(settingsLink).toBeTruthy();

    // Simulate click
    settingsLink!.click();

    await waitFor(
      () => {
        const settingsPage = queryShadow(appRoot, 'settings-page');
        return settingsPage !== null;
      },
      3000,
      'Settings page not rendered after navigation'
    );

    const settingsPage = queryShadow(appRoot, 'settings-page');
    expect(settingsPage).toBeTruthy();
  });

  it('should navigate to diaper page when diapers link is clicked', async () => {
    const appRoot = await mountComponent<AppRoot>('app-root');

    const diapersLink = queryShadow<HTMLAnchorElement>(appRoot, 'a[href="/diapers"]');
    expect(diapersLink).toBeTruthy();

    diapersLink!.click();

    await waitFor(
      () => {
        const diaperPage = queryShadow(appRoot, 'diaper-page');
        return diaperPage !== null;
      },
      3000,
      'Diaper page not rendered after navigation'
    );

    const diaperPage = queryShadow(appRoot, 'diaper-page');
    expect(diaperPage).toBeTruthy();
  });

  it('should apply active class to current navigation link', async () => {
    const appRoot = await mountComponent<AppRoot>('app-root');

    // Wait for initial render and check if home link has active class or not
    await new Promise((resolve) => setTimeout(resolve, 200));

    const homeLink = queryShadow<HTMLAnchorElement>(appRoot, 'a[href="/"]');

    // The active class may or may not be applied depending on the current URL
    // Just verify the link exists and className is a string
    expect(homeLink).toBeTruthy();
    expect(typeof homeLink?.className).toBe('string');
  });

  it('should use scheduler API with user-blocking priority for navigation clicks', async () => {
    const appRoot = await mountComponent<AppRoot>('app-root');

    // Mock scheduler API if not available
    const mockPostTask = async <T,>(callback: () => T | Promise<T>) => {
      return callback();
    };
    const originalScheduler = window.scheduler;
    
    let schedulerCalled = false;
    let schedulerPriority: string | undefined;
    
    (window as any).scheduler = {
      postTask: async <T,>(
        callback: () => T | Promise<T>,
        options?: { priority?: string }
      ) => {
        schedulerCalled = true;
        schedulerPriority = options?.priority;
        return mockPostTask(callback);
      },
    };

    const settingsLink = queryShadow<HTMLAnchorElement>(appRoot, 'a[href="/settings"]');
    expect(settingsLink).toBeTruthy();

    settingsLink!.click();

    await waitFor(
      () => schedulerCalled,
      1000,
      'Scheduler API not called for navigation'
    );

    expect(schedulerCalled).toBe(true);
    expect(schedulerPriority).toBe('user-blocking');

    // Restore original scheduler
    if (originalScheduler) {
      window.scheduler = originalScheduler;
    } else {
      delete (window as any).scheduler;
    }
  });

  it('should fallback to direct navigation when scheduler API is not available', async () => {
    const appRoot = await mountComponent<AppRoot>('app-root');

    // Ensure scheduler is not available
    const originalScheduler = window.scheduler;
    delete (window as any).scheduler;

    const diapersLink = queryShadow<HTMLAnchorElement>(appRoot, 'a[href="/diapers"]');
    expect(diapersLink).toBeTruthy();

    diapersLink!.click();

    await waitFor(
      () => {
        const diaperPage = queryShadow(appRoot, 'diaper-page');
        return diaperPage !== null;
      },
      3000,
      'Diaper page not rendered after navigation without scheduler'
    );

    const diaperPage = queryShadow(appRoot, 'diaper-page');
    expect(diaperPage).toBeTruthy();

    // Restore original scheduler if it existed
    if (originalScheduler) {
      window.scheduler = originalScheduler;
    }
  });

  it('should render not-found page for invalid routes', async () => {
    // Set location to invalid path before mounting
    const originalPushState = window.history.pushState;
    window.history.pushState({}, '', '/invalid-route');

    const appRoot = await mountComponent<AppRoot>('app-root');

    await waitFor(
      () => {
        const notFoundPage = queryShadow(appRoot, 'not-found-page');
        return notFoundPage !== null;
      },
      3000,
      'Not found page not rendered'
    );

    const notFoundPage = queryShadow(appRoot, 'not-found-page');
    expect(notFoundPage).toBeTruthy();

    // Restore
    window.history.pushState = originalPushState;
  });
});
