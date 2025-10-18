import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import '../src/components/feeding-log-list.js';
import { cleanup, mountComponent, queryShadow, queryShadowAll } from './helpers.js';
import type { FeedingLogList } from '../src/components/feeding-log-list.js';
import type { FeedingLog } from '../src/types/feeding-log.js';
import { calculateNextFeedTime } from '../src/types/feeding-log.js';

describe('FeedingLogList', () => {
  let sampleLogs: FeedingLog[];

  beforeEach(() => {
    const now = Date.now();
    sampleLogs = [
      {
        id: 'log-1',
        feedType: 'formula',
        amountMl: 120,
        amountOz: 4,
        durationMinutes: 15,
        isBottleFed: true,
        timestamp: now,
        startTime: now - 15 * 60_000,
        endTime: now,
        nextFeedTime: calculateNextFeedTime(now),
      },
      {
        id: 'log-2',
        feedType: 'milk',
        amountMl: 100,
        amountOz: 3.4,
        durationMinutes: 20,
        isBottleFed: false,
        timestamp: now - 3_600_000,
        startTime: now - 3_600_000 - 20 * 60_000,
        endTime: now - 3_600_000,
        nextFeedTime: calculateNextFeedTime(now - 3_600_000),
      },
    ];
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('should render empty state when no logs', async () => {
    const logList = await mountComponent<FeedingLogList>('feeding-log-list');
    logList.logs = [];

    await new Promise((resolve) => setTimeout(resolve, 100));

    const emptyState = queryShadow(logList, '.empty-state');
    expect(emptyState).toBeTruthy();
    expect(emptyState?.textContent).toContain('No feeding logs yet');
  });

  it('should render log items when logs are provided', async () => {
    const logList = await mountComponent<FeedingLogList>('feeding-log-list');
    logList.logs = sampleLogs;

    await new Promise((resolve) => setTimeout(resolve, 100));

    const logItems = queryShadowAll(logList, '.log-item');
    expect(logItems.length).toBe(2);
  });

  it('should display formula feed type correctly', async () => {
    const logList = await mountComponent<FeedingLogList>('feeding-log-list');
    logList.logs = [sampleLogs[0]];

    await new Promise((resolve) => setTimeout(resolve, 100));

    const logType = queryShadow(logList, '.log-type');
    expect(logType?.textContent).toContain('Formula');
  });

  it('should display breast milk feed type correctly', async () => {
    const logList = await mountComponent<FeedingLogList>('feeding-log-list');
    logList.logs = [sampleLogs[1]];

    await new Promise((resolve) => setTimeout(resolve, 100));

    const logType = queryShadow(logList, '.log-type');
    expect(logType?.textContent).toContain('Breast Milk');
  });

  it('should display amount in ml and oz', async () => {
    const logList = await mountComponent<FeedingLogList>('feeding-log-list');
    logList.logs = [sampleLogs[0]];

    await new Promise((resolve) => setTimeout(resolve, 100));

    const detailValues = queryShadowAll(logList, '.detail-value');
    const amountValue = Array.from(detailValues).find(
      (el) => el.textContent?.includes('ml') && el.textContent?.includes('fl oz')
    );

    expect(amountValue).toBeTruthy();
    expect(amountValue?.textContent).toContain('120 ml');
    expect(amountValue?.textContent).toContain('4 fl oz');
  });

  it('should display duration', async () => {
    const logList = await mountComponent<FeedingLogList>('feeding-log-list');
    logList.logs = [sampleLogs[0]];

    await new Promise((resolve) => setTimeout(resolve, 100));

    const detailValues = queryShadowAll(logList, '.detail-value');
    const durationValue = Array.from(detailValues).find((el) => el.textContent?.includes('min'));

    expect(durationValue).toBeTruthy();
    expect(durationValue?.textContent).toContain('15 min');
  });

  it('should display feeding method', async () => {
    const logList = await mountComponent<FeedingLogList>('feeding-log-list');
    logList.logs = [sampleLogs[0]];

    await new Promise((resolve) => setTimeout(resolve, 100));

    const detailValues = queryShadowAll(logList, '.detail-value');
    const methodValue = Array.from(detailValues).find(
      (el) => el.textContent === 'Bottle' || el.textContent === 'Breast'
    );

    expect(methodValue).toBeTruthy();
    expect(methodValue?.textContent).toBe('Bottle');
  });

  it('should render delete button for each log', async () => {
    const logList = await mountComponent<FeedingLogList>('feeding-log-list');
    logList.logs = sampleLogs;

    await new Promise((resolve) => setTimeout(resolve, 100));

    const deleteButtons = queryShadowAll(logList, '.delete-btn');
    expect(deleteButtons.length).toBe(2);
  });

  it('should display next feed detail', async () => {
    const logList = await mountComponent<FeedingLogList>('feeding-log-list');
    vi.useFakeTimers();
    const baseTime = new Date('2024-01-01T08:00:00Z').getTime();
    vi.setSystemTime(baseTime);
    const customLog: FeedingLog = {
      id: 'log-next-feed',
      feedType: 'formula',
      amountMl: 120,
      amountOz: 4,
      durationMinutes: 20,
      isBottleFed: true,
      timestamp: baseTime,
      startTime: baseTime - 20 * 60_000,
      endTime: baseTime,
      nextFeedTime: calculateNextFeedTime(baseTime),
    };

    logList.logs = [customLog];
    await logList.updateComplete;
    await Promise.resolve();

    const nextFeedLabel = Array.from(queryShadowAll(logList, '.detail-label')).find((el) =>
      el.textContent?.includes('Next feed')
    );
    expect(nextFeedLabel).toBeTruthy();

    const nextFeedValue = nextFeedLabel?.parentElement?.querySelector('.detail-value');
    expect(nextFeedValue?.textContent).toContain('Today');
  });

  it('should dispatch log-deleted event when delete button is clicked', async () => {
    const logList = await mountComponent<FeedingLogList>('feeding-log-list');
    logList.logs = [sampleLogs[0]];

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Listen for the log-deleted event
    const eventPromise = new Promise<CustomEvent>((resolve) => {
      logList.addEventListener(
        'log-deleted',
        (e) => {
          resolve(e as CustomEvent);
        },
        { once: true }
      );
    });

    const deleteButton = queryShadow<HTMLButtonElement>(logList, '.delete-btn');
    deleteButton?.click();

    const event = await eventPromise;
    expect(event.detail).toBe('log-1');
  });

  it('should format time range with "Today" for current day', async () => {
    const logList = await mountComponent<FeedingLogList>('feeding-log-list');
    logList.logs = [sampleLogs[0]];

    await new Promise((resolve) => setTimeout(resolve, 100));

    const logTime = queryShadow(logList, '.log-time');
    expect(logTime?.textContent).toContain('Today');
    expect(logTime?.textContent).toContain('·');
    expect(logTime?.textContent).toContain('–');
  });

  it('should format time range with date for past days', async () => {
    const logList = await mountComponent<FeedingLogList>('feeding-log-list');
    const oldLog = {
      ...sampleLogs[0],
      timestamp: Date.now() - 86_400_000,
      startTime: Date.now() - 86_400_000 - 15 * 60_000,
      endTime: Date.now() - 86_400_000,
    };
    logList.logs = [oldLog];

    await new Promise((resolve) => setTimeout(resolve, 100));

    const logTime = queryShadow(logList, '.log-time');
    expect(logTime?.textContent).toBeTruthy();
    expect(logTime?.textContent).not.toContain('Today');
    expect(logTime?.textContent).toContain('·');
    expect(logTime?.textContent).toContain('–');
  });
});
