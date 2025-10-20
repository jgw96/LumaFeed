import type { DiaperLog, StoolColor, StoolConsistency } from '../types/diaper-log.js';

const STORAGE_FILE_NAME = 'diaper-logs.json';

function normalizeBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function normalizeColor(value: unknown): StoolColor {
  if (value === null) {
    return null;
  }
  const valid: StoolColor[] = ['yellow', 'green', 'brown', 'black', 'red', 'other', null];
  return valid.includes(value as StoolColor) ? (value as StoolColor) : null;
}

function normalizeConsistency(value: unknown): StoolConsistency {
  if (value === null) {
    return null;
  }
  const valid: StoolConsistency[] = ['watery', 'seedy', 'soft', 'pasty', 'formed', 'mucousy', null];
  return valid.includes(value as StoolConsistency) ? (value as StoolConsistency) : null;
}

function normalizeNotes(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function normalizeTimestamp(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return Date.now();
}

export class DiaperStorageService {
  private async getFileHandle(): Promise<FileSystemFileHandle> {
    const root = await navigator.storage.getDirectory();
    return await root.getFileHandle(STORAGE_FILE_NAME, { create: true });
  }

  private normalizeLog(log: Partial<DiaperLog>): DiaperLog {
    const wet = normalizeBoolean(log.wet, true);
    const dirty = normalizeBoolean(log.dirty, false);

    return {
      id: typeof log.id === 'string' && log.id.length > 0 ? log.id : crypto.randomUUID(),
      timestamp: normalizeTimestamp(log.timestamp),
      wet,
      dirty,
      stoolColor: dirty ? normalizeColor(log.stoolColor) : null,
      stoolConsistency: dirty ? normalizeConsistency(log.stoolConsistency) : null,
      containsMucus: dirty ? normalizeBoolean(log.containsMucus) : false,
      containsBlood: dirty ? normalizeBoolean(log.containsBlood) : false,
      notes: normalizeNotes(log.notes),
    };
  }

  async saveLogs(logs: DiaperLog[]): Promise<void> {
    try {
      const fileHandle = await this.getFileHandle();
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(logs, null, 2));
      await writable.close();
    } catch (error) {
      console.error('Error saving diaper logs:', error);
      throw error;
    }
  }

  async loadLogs(): Promise<DiaperLog[]> {
    try {
      const fileHandle = await this.getFileHandle();
      const file = await fileHandle.getFile();
      const contents = await file.text();

      if (!contents.trim()) {
        return [];
      }

      const rawLogs = JSON.parse(contents) as Array<Partial<DiaperLog>>;
      const normalized = rawLogs.map((log) => this.normalizeLog(log));
      normalized.sort((a, b) => b.timestamp - a.timestamp);
      return normalized;
    } catch (error) {
      console.error('Error loading diaper logs:', error);
      return [];
    }
  }

  async addLog(log: Partial<DiaperLog>): Promise<DiaperLog> {
    const normalizedLog = this.normalizeLog(log);
    const logs = await this.loadLogs();
    logs.push(normalizedLog);
    logs.sort((a, b) => b.timestamp - a.timestamp);
    await this.saveLogs(logs);
    return normalizedLog;
  }

  async deleteLog(id: string): Promise<void> {
    const logs = await this.loadLogs();
    const filtered = logs.filter((log) => log.id !== id);
    await this.saveLogs(filtered);
  }
}

export const diaperStorage = new DiaperStorageService();
