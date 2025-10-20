import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { diaperStorage } from '../src/services/diaper-storage.js';

const BASE_TIME = new Date('2024-01-01T00:00:00Z').getTime();

describe('DiaperStorageService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(BASE_TIME);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('normalizes defaults when adding a diaper log', async () => {
    const added = await diaperStorage.addLog({
      dirty: true,
      stoolColor: 'green',
      stoolConsistency: 'seedy',
      containsMucus: 'yes' as unknown as boolean,
      notes: 42 as unknown as string,
      timestamp: String(BASE_TIME - 5_000),
    });

    expect(added.id).toEqual(expect.any(String));
    expect(added.timestamp).toBe(BASE_TIME - 5_000);
    expect(added.wet).toBe(true);
    expect(added.dirty).toBe(true);
    expect(added.stoolColor).toBe('green');
    expect(added.stoolConsistency).toBe('seedy');
    expect(added.containsMucus).toBe(false);
    expect(added.containsBlood).toBe(false);
    expect(added.notes).toBe('');

    const stored = await diaperStorage.loadLogs();
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject(added);
  });

  it('sorts loaded logs in reverse chronological order', async () => {
    const older = await diaperStorage.addLog({
      wet: true,
      dirty: false,
      timestamp: BASE_TIME - 60_000,
    });
    const newer = await diaperStorage.addLog({
      wet: false,
      dirty: true,
      timestamp: BASE_TIME - 5_000,
      stoolColor: 'yellow',
    });

    const logs = await diaperStorage.loadLogs();
    expect(logs).toHaveLength(2);
    expect(logs[0].id).toBe(newer.id);
    expect(logs[1].id).toBe(older.id);
  });

  it('removes logs by id when deleteLog is called', async () => {
    const first = await diaperStorage.addLog({
      wet: true,
      dirty: false,
      timestamp: BASE_TIME - 10_000,
    });
    const second = await diaperStorage.addLog({
      wet: false,
      dirty: true,
      timestamp: BASE_TIME - 5_000,
    });

    await diaperStorage.deleteLog(first.id);

    const logs = await diaperStorage.loadLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].id).toBe(second.id);
  });
});
