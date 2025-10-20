import { describe, it, expect, afterEach, vi } from 'vitest';
import '../src/pages/diaper-page.js';
import '../src/components/diaper-form-dialog.js';
import '../src/components/confirm-dialog.js';
import { cleanup, mountComponent, queryShadow, waitFor } from './helpers.js';
import type { DiaperPage } from '../src/pages/diaper-page.js';
import type { DiaperLog } from '../src/types/diaper-log.js';
import type { DiaperFormDialog } from '../src/components/diaper-form-dialog.js';
import type { AppToast } from '../src/components/app-toast.js';
import type { ConfirmDialog } from '../src/components/confirm-dialog.js';
import { diaperStorage } from '../src/services/diaper-storage.js';

describe('DiaperPage', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('should render the diaper page container', async () => {
    const page = await mountComponent<DiaperPage>('diaper-page');

    const container = queryShadow(page, '.container');
    expect(container).toBeTruthy();
  });

  it('should surface the empty state call to action when no logs', async () => {
    const page = await mountComponent<DiaperPage>('diaper-page');

    await waitFor(
      () => queryShadow(page, 'diaper-log-list') !== null,
      3000,
      'Diaper log list not rendered'
    );

    const logList = queryShadow<HTMLElement>(page, 'diaper-log-list');
    expect(logList).toBeTruthy();

    const cta = queryShadow<HTMLButtonElement>(logList!, '.empty-state button');
    expect(cta).toBeTruthy();
    expect(cta?.textContent?.trim()).toBe('Log a diaper');
  });

  it('should show a loading skeleton while logs load', async () => {
    let resolveLogs: ((value: DiaperLog[]) => void) | undefined;
    const loadSpy = vi.spyOn(diaperStorage, 'loadLogs').mockImplementation(
      () =>
        new Promise<DiaperLog[]>((resolve) => {
          resolveLogs = resolve;
        })
    );

    try {
      const page = await mountComponent<DiaperPage>('diaper-page');

      const skeleton = queryShadow(page, '.logs-skeleton');
      expect(skeleton).toBeTruthy();

      resolveLogs?.([]);
      await page.updateComplete;
    } finally {
      loadSpy.mockRestore();
    }
  });

  it('should open the form dialog when a log add is requested', async () => {
    const page = await mountComponent<DiaperPage>('diaper-page');

    await waitFor(
      () => queryShadow(page, 'diaper-form-dialog') !== null,
      3000,
      'Diaper form dialog not rendered'
    );

    const logList = queryShadow<HTMLElement>(page, 'diaper-log-list');
    const dialog = queryShadow<DiaperFormDialog>(page, 'diaper-form-dialog');

    const openSpy = vi.spyOn(dialog!, 'open');

    logList?.dispatchEvent(
      new CustomEvent('log-add-requested', {
        bubbles: true,
        composed: true,
      })
    );

    await waitFor(() => openSpy.mock.calls.length > 0, 3000, 'Diaper form dialog did not open');

    expect(openSpy).toHaveBeenCalled();
  });

  it('should add a log and show a toast when a log-added event fires', async () => {
    const loadLogsSpy = vi.spyOn(diaperStorage, 'loadLogs').mockResolvedValue([]);
    const page = await mountComponent<DiaperPage>('diaper-page');
    loadLogsSpy.mockClear();

    await waitFor(
      () => queryShadow(page, 'diaper-form-dialog') !== null,
      3000,
      'Diaper form dialog not rendered'
    );

    const addLogSpy = vi.spyOn(diaperStorage, 'addLog').mockResolvedValue({
      id: 'log-1',
      timestamp: Date.now(),
      wet: true,
      dirty: true,
      stoolColor: 'yellow',
      stoolConsistency: 'seedy',
      containsMucus: false,
      containsBlood: false,
      notes: 'All good',
    });

    const toast = queryShadow<AppToast>(page, 'app-toast');
    const toastSpy = toast ? vi.spyOn(toast, 'show') : null;

    const dialog = queryShadow(page, 'diaper-form-dialog');
    const newLog: DiaperLog = {
      id: 'log-added',
      timestamp: Date.now(),
      wet: true,
      dirty: true,
      stoolColor: 'yellow',
      stoolConsistency: 'seedy',
      containsMucus: false,
      containsBlood: false,
      notes: 'Matched',
    };

    dialog?.dispatchEvent(
      new CustomEvent<DiaperLog>('log-added', {
        detail: newLog,
        bubbles: true,
        composed: true,
      })
    );

    await waitFor(
      () => addLogSpy.mock.calls.length > 0,
      3000,
      'Diaper storage addLog was not invoked'
    );
    expect(addLogSpy).toHaveBeenCalledWith(newLog);

    await waitFor(
      () => Boolean(toastSpy && toastSpy.mock.calls.length > 0),
      3000,
      'Diaper toast was not shown'
    );

    const toastArgs = toastSpy!.mock.calls[0]?.[0];
    expect(toastArgs?.headline).toBe('Diaper logged');
    expect(toastArgs?.supporting).toContain('pee + poop diaper');
  });

  it('should confirm and delete logs when the delete event is accepted', async () => {
    const loadLogsSpy = vi.spyOn(diaperStorage, 'loadLogs').mockResolvedValue([]);
    const page = await mountComponent<DiaperPage>('diaper-page');
    loadLogsSpy.mockClear();

    await waitFor(
      () => queryShadow(page, 'confirm-dialog') !== null,
      3000,
      'Confirm dialog not rendered'
    );

    const confirmDialog = queryShadow<ConfirmDialog>(page, 'confirm-dialog');
    const showSpy = vi.spyOn(confirmDialog!, 'show').mockResolvedValue(true);
    const deleteSpy = vi.spyOn(diaperStorage, 'deleteLog').mockResolvedValue();

    const toast = queryShadow<AppToast>(page, 'app-toast');
    const toastSpy = toast ? vi.spyOn(toast, 'show') : null;

    const logList = queryShadow<HTMLElement>(page, 'diaper-log-list');
    logList?.dispatchEvent(
      new CustomEvent<string>('log-deleted', {
        detail: 'log-123',
        bubbles: true,
        composed: true,
      })
    );

    await waitFor(
      () => deleteSpy.mock.calls.length > 0,
      3000,
      'Diaper storage deleteLog was not invoked'
    );

    expect(showSpy).toHaveBeenCalled();
    expect(deleteSpy).toHaveBeenCalledWith('log-123');

    await waitFor(
      () => Boolean(toastSpy && toastSpy.mock.calls.length > 0),
      3000,
      'Deletion toast was not shown'
    );
    expect(toastSpy!.mock.calls[0]?.[0].headline).toBe('Diaper removed');
  });

  it('should not delete logs when the confirmation is cancelled', async () => {
    const loadLogsSpy = vi.spyOn(diaperStorage, 'loadLogs').mockResolvedValue([]);
    const page = await mountComponent<DiaperPage>('diaper-page');
    loadLogsSpy.mockClear();

    await waitFor(
      () => queryShadow(page, 'confirm-dialog') !== null,
      3000,
      'Confirm dialog not rendered'
    );

    const confirmDialog = queryShadow<ConfirmDialog>(page, 'confirm-dialog');
    const showSpy = vi.spyOn(confirmDialog!, 'show').mockResolvedValue(false);
    const deleteSpy = vi.spyOn(diaperStorage, 'deleteLog');

    const logList = queryShadow<HTMLElement>(page, 'diaper-log-list');
    logList?.dispatchEvent(
      new CustomEvent<string>('log-deleted', {
        detail: 'log-xyz',
        bubbles: true,
        composed: true,
      })
    );

    await waitFor(() => showSpy.mock.calls.length > 0, 3000, 'Confirm dialog was not shown');

    expect(deleteSpy).not.toHaveBeenCalled();
  });
});
