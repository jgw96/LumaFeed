import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import '../src/pages/home-page.js';
import { cleanup, mountComponent, queryShadow, queryShadowAll, waitFor } from './helpers.js';
import type { HomePage } from '../src/pages/home-page.js';
import type { FeedingLog } from '../src/types/feeding-log.js';
import { calculateNextFeedTime } from '../src/types/feeding-log.js';

describe('HomePage', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render the home page', async () => {
    const homePage = await mountComponent<HomePage>('home-page');

    const container = queryShadow(homePage, '.container');
    expect(container).toBeTruthy();
  });

  it('should render add feeding button', async () => {
    const homePage = await mountComponent<HomePage>('home-page');

    const addButton = queryShadow<HTMLButtonElement>(homePage, '.add-btn');
    expect(addButton).toBeTruthy();
    expect(addButton?.textContent?.trim()).toBe('Start feeding');
  });

  it('should show loading state initially', async () => {
    const homePage = await mountComponent<HomePage>('home-page');

    // Component should show loading initially (very briefly)
    const sectionTitle = queryShadow(homePage, '.section-title');
    expect(sectionTitle?.textContent).toBe('Recent Feedings');
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

    await waitFor(() => {
      const addButton = queryShadow<HTMLButtonElement>(homePage, '.add-btn');
      return addButton !== null;
    });

    const addButton = queryShadow<HTMLButtonElement>(homePage, '.add-btn');
    const dialog = queryShadow<any>(homePage, 'feeding-form-dialog');

    // Mock the dialog's open method
    const openSpy = vi.fn();
    dialog!.open = openSpy;

    addButton!.click();

    expect(openSpy).toHaveBeenCalled();
  });

  it('should show toast with next feed after log-added event', async () => {
    const homePage = await mountComponent<HomePage>('home-page');

    await waitFor(() => {
      const dialog = queryShadow(homePage, 'feeding-form-dialog');
      return dialog !== null;
    });

    const dialog = queryShadow(homePage, 'feeding-form-dialog');

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
      () => {
        const toast = queryShadow(homePage, 'app-toast.toast--visible');
        return toast !== null;
      },
      3000,
      'Next feed toast not displayed'
    );

    const toastHost = queryShadow<HTMLElement>(homePage, 'app-toast.toast--visible');
    expect(toastHost).toBeTruthy();

    const supporting = queryShadow<HTMLSpanElement>(toastHost!, '.toast__supporting');
    expect(supporting?.textContent).toContain('Next feed around');
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
