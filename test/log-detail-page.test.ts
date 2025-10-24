import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import '../src/pages/log-detail-page.js';
import { cleanup, mountComponent, queryShadow, waitFor } from './helpers.js';
import type { LogDetailPage } from '../src/pages/log-detail-page.js';
import type { FeedingLog } from '../src/types/feeding-log.js';
import { feedingStorage } from '../src/services/feeding-storage.js';

describe('LogDetailPage', () => {
  let originalLocation: Location;
  let originalHistory: History;

  beforeEach(() => {
    originalLocation = window.location;
    originalHistory = window.history;

    // Mock history.pushState
    window.history.pushState = vi.fn();
    window.history.back = vi.fn();
  });

  afterEach(() => {
    cleanup();

    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    });
    Object.defineProperty(window, 'history', {
      writable: true,
      value: originalHistory,
    });
  });

  it('should render error when no ID is provided', async () => {
    // Mock location without ID
    Object.defineProperty(window, 'location', {
      writable: true,
      value: new URL('http://localhost/log'),
    });

    const page = await mountComponent<LogDetailPage>('log-detail-page');

    await waitFor(
      () => {
        const error = queryShadow(page, '.error-state');
        return error !== null;
      },
      3000,
      'Error state not rendered'
    );

    const error = queryShadow<HTMLElement>(page, '.error-state');
    expect(error?.textContent).toContain('No log ID provided');
  });

  it('should load and display log details', async () => {
    const mockLog: FeedingLog = {
      id: 'test-123',
      feedType: 'formula',
      amountMl: 120,
      amountOz: 4.1,
      durationMinutes: 20,
      isBottleFed: true,
      timestamp: Date.now(),
      startTime: Date.now() - 20 * 60000,
      endTime: Date.now(),
      nextFeedTime: Date.now() + 180 * 60000,
    };

    const getLogSpy = vi.spyOn(feedingStorage, 'getLog').mockResolvedValue(mockLog);

    // Mock location with ID
    Object.defineProperty(window, 'location', {
      writable: true,
      value: new URL('http://localhost/log?id=test-123'),
    });

    const page = await mountComponent<LogDetailPage>('log-detail-page');

    // Wait for the form to render by checking for the amount input
    await waitFor(
      () => queryShadow<HTMLInputElement>(page, '#amount') !== null,
      3000,
      'Form not rendered'
    );

    const header = queryShadow<HTMLElement>(page, '.log-type');
    expect(header?.textContent).toContain('Formula');

    const amountInput = queryShadow<HTMLInputElement>(page, '#amount');
    expect(amountInput?.value).toBe('120');

    getLogSpy.mockRestore();
  });

  it('should handle log not found', async () => {
    const getLogSpy = vi.spyOn(feedingStorage, 'getLog').mockResolvedValue(null);

    Object.defineProperty(window, 'location', {
      writable: true,
      value: new URL('http://localhost/log?id=nonexistent'),
    });

    const page = await mountComponent<LogDetailPage>('log-detail-page');

    await waitFor(
      () => {
        const error = queryShadow(page, '.error-state');
        return error !== null;
      },
      3000,
      'Error state not rendered'
    );

    const error = queryShadow<HTMLElement>(page, '.error-state');
    expect(error?.textContent).toContain('Log not found');

    getLogSpy.mockRestore();
  });

  it('should update log when save is clicked', async () => {
    const mockLog: FeedingLog = {
      id: 'test-123',
      feedType: 'formula',
      amountMl: 120,
      amountOz: 4.1,
      durationMinutes: 20,
      isBottleFed: true,
      timestamp: Date.now(),
      startTime: Date.now() - 20 * 60000,
      endTime: Date.now(),
      nextFeedTime: Date.now() + 180 * 60000,
    };

    const getLogSpy = vi.spyOn(feedingStorage, 'getLog').mockResolvedValue(mockLog);
    const updateLogSpy = vi.spyOn(feedingStorage, 'updateLog').mockResolvedValue();

    Object.defineProperty(window, 'location', {
      writable: true,
      value: new URL('http://localhost/log?id=test-123'),
    });

    const page = await mountComponent<LogDetailPage>('log-detail-page');

    await waitFor(
      () => queryShadow<HTMLInputElement>(page, '#amount') !== null,
      3000,
      'Form not rendered'
    );

    // Change amount
    const amountInput = queryShadow<HTMLInputElement>(page, '#amount');
    if (amountInput) {
      amountInput.value = '150';
      amountInput.dispatchEvent(new Event('input', { bubbles: true }));
      await page.updateComplete;
    }

    // Click save
    const saveButton = queryShadow<HTMLButtonElement>(page, '.btn-primary');
    saveButton?.click();
    await page.updateComplete;

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(updateLogSpy).toHaveBeenCalled();
    expect(window.history.back).toHaveBeenCalled();

    getLogSpy.mockRestore();
    updateLogSpy.mockRestore();
  });

  it('should delete log when delete button is clicked', async () => {
    const mockLog: FeedingLog = {
      id: 'test-123',
      feedType: 'formula',
      amountMl: 120,
      amountOz: 4.1,
      durationMinutes: 20,
      isBottleFed: true,
      timestamp: Date.now(),
      startTime: Date.now() - 20 * 60000,
      endTime: Date.now(),
      nextFeedTime: Date.now() + 180 * 60000,
    };

    const getLogSpy = vi.spyOn(feedingStorage, 'getLog').mockResolvedValue(mockLog);
    const deleteLogSpy = vi.spyOn(feedingStorage, 'deleteLog').mockResolvedValue();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    Object.defineProperty(window, 'location', {
      writable: true,
      value: new URL('http://localhost/log?id=test-123'),
    });

    const page = await mountComponent<LogDetailPage>('log-detail-page');

    await waitFor(
      () => queryShadow<HTMLInputElement>(page, '#amount') !== null,
      3000,
      'Form not rendered'
    );

    // Click delete
    const deleteButton = queryShadow<HTMLButtonElement>(page, '.btn-danger');
    deleteButton?.click();
    await page.updateComplete;

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(confirmSpy).toHaveBeenCalled();
    expect(deleteLogSpy).toHaveBeenCalledWith('test-123');
    expect(window.history.back).toHaveBeenCalled();

    getLogSpy.mockRestore();
    deleteLogSpy.mockRestore();
    confirmSpy.mockRestore();
  });
});
