import { calculateNextFeedTime, type FeedingLog } from '../types/feeding-log.js';
import { settingsService } from './settings-service.js';

const STORAGE_FILE_NAME = 'feeding-logs.json';
const DEFAULT_DURATION_MINUTES = 20;

export class FeedingStorageService {
  private async getFileHandle(): Promise<FileSystemFileHandle> {
    const root = await navigator.storage.getDirectory();
    return await root.getFileHandle(STORAGE_FILE_NAME, { create: true });
  }

  async saveLogs(logs: FeedingLog[]): Promise<void> {
    try {
      const fileHandle = await this.getFileHandle();
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(logs, null, 2));
      await writable.close();
    } catch (error) {
      console.error('Error saving feeding logs:', error);
      throw error;
    }
  }

  async loadLogs(): Promise<FeedingLog[]> {
    try {
      const fileHandle = await this.getFileHandle();
      const file = await fileHandle.getFile();
      const contents = await file.text();

      if (!contents.trim()) {
        return [];
      }

      const rawLogs = JSON.parse(contents) as FeedingLog[];
      const defaultInterval = await settingsService.getDefaultFeedIntervalMinutes();
      const normalized = rawLogs.map((log) => {
        const fallbackEnd = log.timestamp ?? Date.now();
        const endTime = typeof log.endTime === 'number' ? log.endTime : fallbackEnd;

        let startTime: number;
        if (typeof log.startTime === 'number') {
          startTime = log.startTime;
        } else if (typeof log.durationMinutes === 'number' && log.durationMinutes > 0) {
          startTime = endTime - log.durationMinutes * 60_000;
        } else {
          startTime = endTime - DEFAULT_DURATION_MINUTES * 60_000;
        }

        let durationMinutes = log.durationMinutes;
        if (typeof durationMinutes !== 'number' || durationMinutes <= 0) {
          const diffMinutes = Math.round((endTime - startTime) / 60_000);
          durationMinutes = Math.max(1, diffMinutes);
        }

        const nextFeedTime =
          typeof log.nextFeedTime === 'number' && log.nextFeedTime > endTime
            ? log.nextFeedTime
            : calculateNextFeedTime(endTime, defaultInterval);

        return {
          ...log,
          durationMinutes,
          startTime,
          endTime,
          timestamp: log.timestamp ?? endTime,
          nextFeedTime,
        } satisfies FeedingLog;
      });
      normalized.sort((a, b) => b.endTime - a.endTime);
      return normalized;
    } catch (error) {
      console.error('Error loading feeding logs:', error);
      return [];
    }
  }

  async addLog(log: FeedingLog): Promise<void> {
    const logs = await this.loadLogs();
    const baseTime = typeof log.endTime === 'number' ? log.endTime : log.timestamp;
    const defaultInterval = await settingsService.getDefaultFeedIntervalMinutes();
    const normalizedLog: FeedingLog = {
      ...log,
      nextFeedTime:
        typeof log.nextFeedTime === 'number' && log.nextFeedTime > baseTime
          ? log.nextFeedTime
          : calculateNextFeedTime(baseTime, defaultInterval),
    };

    logs.push(normalizedLog);
    logs.sort((a, b) => {
      const aTime = typeof a.endTime === 'number' ? a.endTime : a.timestamp;
      const bTime = typeof b.endTime === 'number' ? b.endTime : b.timestamp;
      return bTime - aTime;
    });
    await this.saveLogs(logs);
  }

  async deleteLog(id: string): Promise<void> {
    const logs = await this.loadLogs();
    const filtered = logs.filter((log) => log.id !== id);
    await this.saveLogs(filtered);
  }
}

export const feedingStorage = new FeedingStorageService();
