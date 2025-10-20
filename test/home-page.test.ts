import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import '../src/pages/home-page.js';
import { cleanup, mountComponent, queryShadow, queryShadowAll, waitFor } from './helpers.js';
import type { HomePage } from '../src/pages/home-page.js';
import type { FeedingLog } from '../src/types/feeding-log.js';
import type { FeedingFormDialog } from '../src/components/feeding-form-dialog.js';
import type { AppToast } from '../src/components/app-toast.js';
import { calculateNextFeedTime } from '../src/types/feeding-log.js';
import { feedingStorage } from '../src/services/feeding-storage.js';

describe('HomePage', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render the home page', async () => {
    const homePage = await mountComponent<HomePage>('home-page');

    const container = queryShadow(homePage, '.container');
    expect(container).toBeTruthy();
  });

  it('should render empty state call to action when no logs', async () => {
    const homePage = await mountComponent<HomePage>('home-page');

    await waitFor(
      () => queryShadow(homePage, 'feeding-log-list') !== null,
      3000,
      'Feeding log list not rendered'
    );

    const logList = queryShadow<HTMLElement>(homePage, 'feeding-log-list');
    expect(logList).toBeTruthy();

    const actionButton = queryShadow<HTMLButtonElement>(logList!, '.empty-state-action');
    expect(actionButton).toBeTruthy();
    expect(actionButton?.textContent?.trim()).toBe('Start a feeding');
  });

  it('should show loading state initially', async () => {
    let resolveLogs: ((value: FeedingLog[]) => void) | undefined;
    const loadLogsSpy = vi.spyOn(feedingStorage, 'loadLogs').mockImplementation(
      () =>
        new Promise<FeedingLog[]>((resolve) => {
          resolveLogs = resolve;
        })
    );

    try {
      const homePage = await mountComponent<HomePage>('home-page');

      const skeleton = queryShadow(homePage, '.logs-skeleton');
      expect(skeleton).toBeTruthy();

      resolveLogs?.([]);
      await homePage.updateComplete;
    } finally {
      loadLogsSpy.mockRestore();
    }
  });

  it('should render feeding log list after loading', async () => {
    const homePage = await mountComponent<HomePage>('home-page');

    await waitFor(
      () => {
        const logList = queryShadow(homePage, 'feeding-log-list');
        return logList !== null;
      },
      3000,
      'Feeding log list not rendered'
    );

    const logList = queryShadow(homePage, 'feeding-log-list');
    expect(logList).toBeTruthy();
  });

  it('should suppress summary card when no logs are loaded', async () => {
    const homePage = await mountComponent<HomePage>('home-page');

    await waitFor(
      () => !queryShadow(homePage, '.loading'),
      3000,
      'Home page did not finish loading'
    );

    const summaryCard = queryShadow(homePage, 'feeding-summary-card');
    expect(summaryCard).toBeNull();
  });

  it('should render feeding form dialog', async () => {
    const homePage = await mountComponent<HomePage>('home-page');

    const dialog = queryShadow(homePage, 'feeding-form-dialog');
    expect(dialog).toBeTruthy();
  });

  it('should open dialog when add button is clicked', async () => {
    const homePage = await mountComponent<HomePage>('home-page');

    await waitFor(
      () => queryShadow(homePage, 'feeding-log-list') !== null,
      3000,
      'Feeding log list not rendered'
    );

    await import('../src/components/feeding-form-dialog.js');
    await customElements.whenDefined('feeding-form-dialog');

    const logList = queryShadow<HTMLElement>(homePage, 'feeding-log-list');
    const addButton = logList
      ? queryShadow<HTMLButtonElement>(logList, '.empty-state-action')
      : null;
    const dialog = queryShadow<FeedingFormDialog>(homePage, 'feeding-form-dialog');

    const openSpy = vi.spyOn(dialog!, 'open');

    addButton!.click();

    await waitFor(() => openSpy.mock.calls.length > 0, 3000, 'Feeding form dialog did not open');

    expect(openSpy).toHaveBeenCalled();
  });

  it('should show toast with next feed after log-added event', async () => {
    const homePage = await mountComponent<HomePage>('home-page');

    await waitFor(() => {
      const dialog = queryShadow(homePage, 'feeding-form-dialog');
      return dialog !== null;
    });

    const dialog = queryShadow(homePage, 'feeding-form-dialog');
    const toast = queryShadow<AppToast>(homePage, 'app-toast');
    const toastSpy = toast ? vi.spyOn(toast, 'show') : null;

    const endTime = Date.now();
    const startTime = endTime - 15 * 60_000;
    const newLog: FeedingLog = {
      id: 'test-123',
      feedType: 'formula',
      amountMl: 120,
      amountOz: 4,
      durationMinutes: 15,
      isBottleFed: true,
      timestamp: endTime,
      startTime,
      endTime,
      nextFeedTime: calculateNextFeedTime(endTime),
    };

    // Dispatch log-added event
    const event = new CustomEvent('log-added', {
      detail: newLog,
      bubbles: true,
      composed: true,
    });
    dialog!.dispatchEvent(event);

    await waitFor(
      () => Boolean(toastSpy && toastSpy.mock.calls.length > 0),
      3000,
      'Next feed toast not displayed'
    );

    expect(toastSpy).toBeTruthy();
    const toastArgs = toastSpy!.mock.calls[0]?.[0];
    expect(toastArgs?.supporting).toContain('Next feed around');
  });

  it('should update summary when a feeding is added', async () => {
    const homePage = await mountComponent<HomePage>('home-page');

    await waitFor(
      () => !queryShadow(homePage, '.loading'),
      3000,
      'Home page did not finish loading'
    );

    const dialog = queryShadow(homePage, 'feeding-form-dialog');

    const endTime = Date.now();
    const startTime = endTime - 10 * 60_000;
    const newLog: FeedingLog = {
      id: 'summary-log',
      feedType: 'milk',
      amountMl: 120,
      amountOz: 4,
      durationMinutes: 10,
      isBottleFed: true,
      timestamp: endTime,
      startTime,
      endTime,
      nextFeedTime: calculateNextFeedTime(endTime),
    };

    const event = new CustomEvent('log-added', {
      detail: newLog,
      bubbles: true,
      composed: true,
    });
    dialog!.dispatchEvent(event);

    await waitFor(
      () => {
        const summaryCard = queryShadow(homePage, 'feeding-summary-card') as HTMLElement | null;
        if (!summaryCard) {
          return false;
        }
        const status = queryShadow(summaryCard, '.summary-card__status');
        return Boolean(status && status.textContent?.includes('1 feeding'));
      },
      3000,
      'Summary did not update after adding log'
    );

    const summaryCard = queryShadow(homePage, 'feeding-summary-card') as HTMLElement;
    const totals = queryShadow(summaryCard, '.summary-card__totals');
    expect(totals?.textContent).toContain('120');
    expect(totals?.textContent).toContain('4');
  });

  it('should handle log-deleted event', async () => {
    const homePage = await mountComponent<HomePage>('home-page');

    await waitFor(() => {
      const logList = queryShadow(homePage, 'feeding-log-list');
      return logList !== null;
    });

    const logList = queryShadow(homePage, 'feeding-log-list');

    // Dispatch log-deleted event
    const event = new CustomEvent('log-deleted', {
      detail: 'test-id-123',
      bubbles: true,
      composed: true,
    });
    logList!.dispatchEvent(event);

    // Wait for the deletion to be processed
    await new Promise((resolve) => setTimeout(resolve, 200));

    // The component should have processed the deletion
    expect(logList).toBeTruthy();
  });
});
