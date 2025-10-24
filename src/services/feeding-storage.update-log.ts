import { calculateNextFeedTime, type FeedingLog } from '../types/feeding-log.js';
import { settingsService } from './settings-service.js';

export async function updateLogImpl(
  updatedLog: FeedingLog,
  loadLogs: () => Promise<FeedingLog[]>,
  saveLogs: (logs: FeedingLog[]) => Promise<void>
): Promise<void> {
  const logs = await loadLogs();
  const index = logs.findIndex((log) => log.id === updatedLog.id);

  if (index === -1) {
    throw new Error(`Log with id ${updatedLog.id} not found`);
  }

  const baseTime =
    typeof updatedLog.endTime === 'number' ? updatedLog.endTime : updatedLog.timestamp;
  const defaultInterval = await settingsService.getDefaultFeedIntervalMinutes();

  const normalizedLog: FeedingLog = {
    ...updatedLog,
    nextFeedTime:
      typeof updatedLog.nextFeedTime === 'number' && updatedLog.nextFeedTime > baseTime
        ? updatedLog.nextFeedTime
        : calculateNextFeedTime(baseTime, defaultInterval),
  };

  logs[index] = normalizedLog;
  logs.sort((a, b) => {
    const aTime = typeof a.endTime === 'number' ? a.endTime : a.timestamp;
    const bTime = typeof b.endTime === 'number' ? b.endTime : b.timestamp;
    return bTime - aTime;
  });

  await saveLogs(logs);
}
