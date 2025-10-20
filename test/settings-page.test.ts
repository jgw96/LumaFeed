import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '../src/pages/settings-page.js';
import { cleanup, mountComponent, queryShadow, waitFor } from './helpers.js';
import { settingsService } from '../src/services/settings-service.js';
import { DEFAULT_NEXT_FEED_INTERVAL_MINUTES } from '../src/types/feeding-log.js';

const SETTINGS_STORAGE_KEY = 'feeding-tracker-settings';
const mockMatchMedia = (matches: boolean) => {
  const stub = (query: string) =>
    ({
      matches,
      media: query,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent() {
        return false;
      },
    }) as MediaQueryList;

  try {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: stub,
    });
  } catch {
    try {
      (window as any).matchMedia = stub;
    } catch {
      // Unable to override, rely on existing implementation.
    }
  }
};

describe('SettingsPage', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(SETTINGS_STORAGE_KEY);
    }
    settingsService.clearCache();
  });

  afterEach(() => {
    cleanup();
  });

  it('should render the appearance section heading', async () => {
    const settingsPage = await mountComponent<HTMLElement>('settings-page');

    const heading = queryShadow(settingsPage, '.section__title');
    expect(heading?.textContent).toBe('Appearance');
  });

  it('should show the default feed interval', async () => {
    const settingsPage = await mountComponent<HTMLElement>('settings-page');

    await waitFor(() => {
      const input = queryShadow<HTMLInputElement>(settingsPage, '#default-feed-interval');
      return input !== null && input.value !== '';
    });

    const input = queryShadow<HTMLInputElement>(settingsPage, '#default-feed-interval');
    expect(input?.value).toBe(String(DEFAULT_NEXT_FEED_INTERVAL_MINUTES));
  });

  it('should persist updated feed interval', async () => {
    const settingsPage = await mountComponent<HTMLElement>('settings-page');

    await waitFor(() => {
      const input = queryShadow<HTMLInputElement>(settingsPage, '#default-feed-interval');
      return input !== null && input.value !== '';
    });

    const input = queryShadow<HTMLInputElement>(settingsPage, '#default-feed-interval');
    expect(input).toBeTruthy();

    input!.value = '210';
    input!.dispatchEvent(new Event('input', { bubbles: true }));

    await new Promise((resolve) => setTimeout(resolve, 600));

    const interval = await settingsService.getDefaultFeedIntervalMinutes();
    expect(interval).toBe(210);
  });

  it('initializes the dark mode toggle to match the device preference', async () => {
    mockMatchMedia(true);
    const settingsPage = await mountComponent<HTMLElement>('settings-page');

    await waitFor(() => {
      const toggle = queryShadow<HTMLInputElement>(settingsPage, 'input[name="dark-mode"]');
      return toggle !== null;
    });

    const toggle = queryShadow<HTMLInputElement>(settingsPage, 'input[name="dark-mode"]');
    expect(toggle?.checked).toBe(true);
  });

  it('persists the theme preference when dark mode is toggled', async () => {
    mockMatchMedia(false);
    const settingsPage = await mountComponent<HTMLElement>('settings-page');

    await waitFor(() => {
      const toggle = queryShadow<HTMLInputElement>(settingsPage, 'input[name="dark-mode"]');
      return toggle !== null;
    });

    const toggle = queryShadow<HTMLInputElement>(settingsPage, 'input[name="dark-mode"]');
    expect(toggle).toBeTruthy();

    toggle!.checked = true;
    toggle!.dispatchEvent(new Event('change', { bubbles: true }));

    await new Promise((resolve) => setTimeout(resolve, 600));

    const settings = await settingsService.getSettings();
    expect(settings.themePreference).toBe('dark');
  });

  it('allows resetting the theme preference back to the device default', async () => {
    mockMatchMedia(false);
    const settingsPage = await mountComponent<HTMLElement>('settings-page');

    await waitFor(() => {
      const toggle = queryShadow<HTMLInputElement>(settingsPage, 'input[name="dark-mode"]');
      return toggle !== null;
    });

    const toggle = queryShadow<HTMLInputElement>(settingsPage, 'input[name="dark-mode"]');
    toggle!.checked = true;
    toggle!.dispatchEvent(new Event('change', { bubbles: true }));

    await new Promise((resolve) => setTimeout(resolve, 600));

    let settings = await settingsService.getSettings();
    expect(settings.themePreference).toBe('dark');

    const resetButton = queryShadow<HTMLButtonElement>(settingsPage, '.appearance__device-reset');
    expect(resetButton).toBeTruthy();

    resetButton!.click();

    await new Promise((resolve) => setTimeout(resolve, 600));

    settings = await settingsService.getSettings();
    expect(settings.themePreference).toBe('system');
  });
});
