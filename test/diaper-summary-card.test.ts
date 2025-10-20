import { describe, it, expect, afterEach } from 'vitest';
import '../src/components/diaper-summary-card.js';
import { cleanup, mountComponent, queryShadow } from './helpers.js';
import type { DiaperSummaryCard } from '../src/components/diaper-summary-card.js';
import type { DiaperLog } from '../src/types/diaper-log.js';

describe('DiaperSummaryCard', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render the loading state', async () => {
    const card = await mountComponent<DiaperSummaryCard>('diaper-summary-card');
    card.loading = true;

    await card.updateComplete;

    const loadingMessage = queryShadow(card, '.summary-card__empty');
    expect(loadingMessage?.textContent).toContain('Loading diaper summary…');
  });

  it('should render empty summaries when no logs are present', async () => {
    const card = await mountComponent<DiaperSummaryCard>('diaper-summary-card');
    card.logs = [];
    card.loading = false;

    await card.updateComplete;

    const last24Empty = queryShadow(
      card,
      'section[aria-label="Last 24 hours"] .summary-card__empty'
    );
    expect(last24Empty?.textContent).toContain('No diapers logged yet.');

    const last7Empty = queryShadow(card, 'section[aria-label="Last 7 days"] .summary-card__empty');
    expect(last7Empty?.textContent).toContain('Log a few diapers to see weekly trends');
  });

  it('should display diaper statistics for recent logs', async () => {
    const card = await mountComponent<DiaperSummaryCard>('diaper-summary-card');
    const now = Date.now();
    const logs: DiaperLog[] = [
      {
        id: 'wet-only',
        timestamp: now - 45 * 60_000,
        wet: true,
        dirty: false,
        stoolColor: null,
        stoolConsistency: null,
        containsMucus: false,
        containsBlood: false,
        notes: '',
      },
      {
        id: 'double',
        timestamp: now - 3 * 60 * 60_000,
        wet: true,
        dirty: true,
        stoolColor: 'green',
        stoolConsistency: 'soft',
        containsMucus: false,
        containsBlood: false,
        notes: 'Healthy stool.',
      },
      {
        id: 'older-dirty',
        timestamp: now - 26 * 60 * 60_000,
        wet: false,
        dirty: true,
        stoolColor: 'brown',
        stoolConsistency: 'formed',
        containsMucus: false,
        containsBlood: false,
        notes: '',
      },
      {
        id: 'week-ago',
        timestamp: now - 5 * 24 * 60 * 60_000,
        wet: true,
        dirty: false,
        stoolColor: null,
        stoolConsistency: null,
        containsMucus: false,
        containsBlood: false,
        notes: '',
      },
    ];
    card.logs = logs;
    card.loading = false;

    await card.updateComplete;
    await Promise.resolve();

    const last24Card = queryShadow<HTMLElement>(card, 'section[aria-label="Last 24 hours"]');
    expect(last24Card).toBeTruthy();

    const last24Status = last24Card?.querySelector('.summary-card__status');
    expect(last24Status?.textContent).toContain('2 diaper changes');

    const last24Metrics = last24Card?.querySelectorAll('.summary-card__metric-value') ?? [];
    expect(last24Metrics[0]?.textContent).toContain('2'); // Total changes
    expect(last24Metrics[1]?.textContent).toContain('2'); // Wet diapers
    expect(last24Metrics[2]?.textContent).toContain('1'); // Dirty diapers
    expect(last24Metrics[3]?.textContent).not.toBe('—'); // Average interval populated

    const lastWet = last24Card?.querySelector('.summary-card__metadata-value');
    expect(lastWet?.textContent).not.toBe('Not yet recorded');

    const last7Card = queryShadow<HTMLElement>(card, 'section[aria-label="Last 7 days"]');
    expect(last7Card).toBeTruthy();

    const last7Status = last7Card?.querySelector('.summary-card__status');
    expect(last7Status?.textContent).toContain('4 diaper changes this week');

    const averagePerDay = last7Card
      ?.querySelectorAll('.summary-card__metric-value')?.[1]
      ?.textContent?.trim();
    expect(averagePerDay).toBeTruthy();
    expect(averagePerDay).not.toBe('—');

    const chartCanvas = last7Card?.querySelector('canvas');
    expect(chartCanvas).toBeTruthy();
  });
});
