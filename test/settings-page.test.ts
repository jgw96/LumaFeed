import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '../src/pages/settings-page.js';
import { cleanup, mountComponent, queryShadow, waitFor } from './helpers.js';
import { settingsService } from '../src/services/settings-service.js';
import { DEFAULT_NEXT_FEED_INTERVAL_MINUTES } from '../src/types/feeding-log.js';

const SETTINGS_STORAGE_KEY = 'feeding-tracker-settings';

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

  it('should render the settings page heading', async () => {
    const settingsPage = await mountComponent<HTMLElement>('settings-page');

    const heading = queryShadow(settingsPage, 'h1');
    expect(heading?.textContent).toBe('Settings');
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

    const form = queryShadow<HTMLFormElement>(settingsPage, 'form');
    expect(form).toBeTruthy();

    form!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await waitFor(
      () => {
        const status = queryShadow(settingsPage, '.status');
        return status?.textContent?.includes('Settings saved') ?? false;
      },
      3000,
      'Settings did not report a successful save'
    );

    const interval = await settingsService.getDefaultFeedIntervalMinutes();
    expect(interval).toBe(210);
  });
});
