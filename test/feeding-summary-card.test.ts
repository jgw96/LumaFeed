import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import '../src/components/feeding-summary-card.js';
import { cleanup, mountComponent, queryShadow } from './helpers.js';
import type { FeedingSummaryCard } from '../src/components/feeding-summary-card.js';
import type { FeedingLog } from '../src/types/feeding-log.js';
import { calculateNextFeedTime } from '../src/types/feeding-log.js';

const AVERAGE_INTERVAL_ARIA_LABEL = 'Average interval between feedings in the last 24 hours';

describe('FeedingSummaryCard', () => {
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
        timestamp: now - 3 * 60 * 60_000, // 3 hours ago
        startTime: now - 3 * 60 * 60_000 - 20 * 60_000,
        endTime: now - 3 * 60 * 60_000,
        nextFeedTime: calculateNextFeedTime(now - 3 * 60 * 60_000),
      },
      {
        id: 'log-3',
        feedType: 'formula',
        amountMl: 150,
        amountOz: 5,
        durationMinutes: 18,
        isBottleFed: true,
        timestamp: now - 6 * 60 * 60_000, // 6 hours ago
        startTime: now - 6 * 60 * 60_000 - 18 * 60_000,
        endTime: now - 6 * 60 * 60_000,
        nextFeedTime: calculateNextFeedTime(now - 6 * 60 * 60_000),
      },
    ];
  });

  afterEach(() => {
    cleanup();
  });

  it('should render without errors', async () => {
    const card = await mountComponent<FeedingSummaryCard>('feeding-summary-card');
    expect(card).toBeTruthy();
  });

  it('should show empty state when no logs', async () => {
    const card = await mountComponent<FeedingSummaryCard>('feeding-summary-card');
    card.logs = [];
    card.loading = false;

    await new Promise((resolve) => setTimeout(resolve, 100));

    const status = queryShadow(card, '.summary-card__status');
    expect(status?.textContent).toContain('No feedings logged yet');
  });

  it('should display feeding count correctly', async () => {
    const card = await mountComponent<FeedingSummaryCard>('feeding-summary-card');
    card.logs = sampleLogs;
    card.loading = false;

    await new Promise((resolve) => setTimeout(resolve, 100));

    const status = queryShadow(card, '.summary-card__status');
    expect(status?.textContent).toContain('3 feedings');
  });

  it('should display total ml and oz', async () => {
    const card = await mountComponent<FeedingSummaryCard>('feeding-summary-card');
    card.logs = sampleLogs;
    card.loading = false;

    await new Promise((resolve) => setTimeout(resolve, 100));

    const totals = queryShadow(card, '.summary-card__totals');
    expect(totals?.textContent).toContain('370 ml'); // 120 + 100 + 150
    expect(totals?.textContent).toContain('12.4 oz'); // 4 + 3.4 + 5
  });

  it('should calculate and display average interval for 2+ feeds', async () => {
    const card = await mountComponent<FeedingSummaryCard>('feeding-summary-card');
    card.logs = sampleLogs;
    card.loading = false;

    await new Promise((resolve) => setTimeout(resolve, 100));

    const intervalHighlight = queryShadow(
      card,
      `.summary-card__highlight[aria-label="${AVERAGE_INTERVAL_ARIA_LABEL}"]`
    );
    expect(intervalHighlight).toBeTruthy();

    const label = intervalHighlight?.querySelector('.summary-card__highlight-label');
    expect(label?.textContent?.trim()).toBe('Average interval');

    const value = intervalHighlight?.querySelector('.summary-card__highlight-value');
    expect(value?.textContent).toContain('3 hrs'); // Average of 3 hours and 3 hours
  });

  it('should not display average interval when only 1 feed', async () => {
    const card = await mountComponent<FeedingSummaryCard>('feeding-summary-card');
    card.logs = [sampleLogs[0]];
    card.loading = false;

    await new Promise((resolve) => setTimeout(resolve, 100));

    const intervalHighlight = queryShadow(
      card,
      `.summary-card__highlight[aria-label="${AVERAGE_INTERVAL_ARIA_LABEL}"]`
    );
    expect(intervalHighlight).toBeFalsy();
  });

  it('should format interval in hours and minutes', async () => {
    const now = Date.now();
    const logsWithMixedInterval: FeedingLog[] = [
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
        timestamp: now - 2.5 * 60 * 60_000, // 2.5 hours ago
        startTime: now - 2.5 * 60 * 60_000 - 20 * 60_000,
        endTime: now - 2.5 * 60 * 60_000,
        nextFeedTime: calculateNextFeedTime(now - 2.5 * 60 * 60_000),
      },
    ];

    const card = await mountComponent<FeedingSummaryCard>('feeding-summary-card');
    card.logs = logsWithMixedInterval;
    card.loading = false;

    await new Promise((resolve) => setTimeout(resolve, 100));

    const intervalHighlight = queryShadow(
      card,
      `.summary-card__highlight[aria-label="${AVERAGE_INTERVAL_ARIA_LABEL}"]`
    );
    expect(intervalHighlight).toBeTruthy();

    const intervalValue = intervalHighlight?.querySelector('.summary-card__highlight-value');
    expect(intervalValue?.textContent).toContain('2 hr 30 min'); // 2.5 hours = 2 hr 30 min
  });

  it('should only consider feeds in last 24 hours', async () => {
    const now = Date.now();
    const logsWithOldFeed: FeedingLog[] = [
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
        timestamp: now - 25 * 60 * 60_000, // 25 hours ago (should be excluded)
        startTime: now - 25 * 60 * 60_000 - 20 * 60_000,
        endTime: now - 25 * 60 * 60_000,
        nextFeedTime: calculateNextFeedTime(now - 25 * 60 * 60_000),
      },
    ];

    const card = await mountComponent<FeedingSummaryCard>('feeding-summary-card');
    card.logs = logsWithOldFeed;
    card.loading = false;

    await new Promise((resolve) => setTimeout(resolve, 100));

    const status = queryShadow(card, '.summary-card__status');
    expect(status?.textContent).toContain('1 feeding'); // Only one within 24 hours

    const intervalHighlight = queryShadow(
      card,
      `.summary-card__highlight[aria-label="${AVERAGE_INTERVAL_ARIA_LABEL}"]`
    );
    expect(intervalHighlight).toBeFalsy(); // No interval with only 1 feed
  });
});
