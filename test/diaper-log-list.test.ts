import { describe, it, expect, afterEach } from 'vitest';
import '../src/components/diaper-log-list.js';
import { cleanup, mountComponent, queryShadow, queryShadowAll } from './helpers.js';
import type { DiaperLogList } from '../src/components/diaper-log-list.js';
import type { DiaperLog } from '../src/types/diaper-log.js';

describe('DiaperLogList', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render the empty state messaging and CTA', async () => {
    const logList = await mountComponent<DiaperLogList>('diaper-log-list');
    logList.logs = [];

    await logList.updateComplete;
    await Promise.resolve();

    const emptyState = queryShadow(logList, '.empty-state');
    expect(emptyState).toBeTruthy();
    expect(emptyState?.textContent).toContain('Track diaper changes');

    const cta = queryShadow<HTMLButtonElement>(logList, '.empty-state button');
    expect(cta?.textContent?.trim()).toBe('Log a diaper');
  });

  it('should dispatch log-add-requested when the empty state CTA is clicked', async () => {
    const logList = await mountComponent<DiaperLogList>('diaper-log-list');
    logList.logs = [];
    await logList.updateComplete;

    const eventPromise = new Promise<CustomEvent>((resolve) => {
      logList.addEventListener('log-add-requested', (event) => resolve(event as CustomEvent), {
        once: true,
      });
    });

    const cta = queryShadow<HTMLButtonElement>(logList, '.empty-state button');
    cta?.click();

    const event = await eventPromise;
    expect(event.type).toBe('log-add-requested');
  });

  it('should render detailed information for mixed diapers', async () => {
    const logList = await mountComponent<DiaperLogList>('diaper-log-list');
    const now = Date.now();
    const logs: DiaperLog[] = [
      {
        id: 'log-1',
        timestamp: now - 30 * 60_000,
        wet: true,
        dirty: true,
        stoolColor: 'yellow',
        stoolConsistency: 'seedy',
        containsMucus: true,
        containsBlood: false,
        notes: 'Plenty of seeds noted.',
      },
    ];
    logList.logs = logs;

    await logList.updateComplete;
    await Promise.resolve();

    const logType = queryShadow(logList, '.log-type');
    expect(logType?.textContent).toContain('Wet + dirty diaper');

    const badges = Array.from(queryShadowAll(logList, '.badge')).map((badge) =>
      badge.textContent?.trim()
    );
    expect(badges).toEqual(expect.arrayContaining(['Pee', 'Poop', 'Double']));

    const detailLabels = Array.from(queryShadowAll(logList, '.detail-label')).map((label) =>
      label.textContent?.trim()
    );
    expect(detailLabels).toEqual(
      expect.arrayContaining(['Recorded', 'Stool color', 'Consistency', 'Observation'])
    );

    const detailValues = Array.from(queryShadowAll(logList, '.detail-value')).map((value) =>
      value.textContent?.trim()
    );
    expect(detailValues).toEqual(expect.arrayContaining(['Yellow', 'Seedy', 'Contains mucus']));

    const notes = queryShadow(logList, '.notes');
    expect(notes?.textContent).toContain('Plenty of seeds noted.');

    const relative = queryShadow(logList, '.log-time span:last-child');
    expect(relative?.textContent?.trim()).toBeTruthy();
  });

  it('should dispatch log-deleted when the delete button is clicked', async () => {
    const logList = await mountComponent<DiaperLogList>('diaper-log-list');
    const now = Date.now();
    logList.logs = [
      {
        id: 'delete-me',
        timestamp: now,
        wet: true,
        dirty: false,
        stoolColor: null,
        stoolConsistency: null,
        containsMucus: false,
        containsBlood: false,
        notes: '',
      },
    ];

    await logList.updateComplete;
    await Promise.resolve();

    const eventPromise = new Promise<CustomEvent>((resolve) => {
      logList.addEventListener('log-deleted', (event) => resolve(event as CustomEvent), {
        once: true,
      });
    });

    const deleteButton = queryShadow<HTMLButtonElement>(logList, '.delete-btn');
    deleteButton?.click();

    const event = await eventPromise;
    expect(event.detail).toBe('delete-me');
  });
});
