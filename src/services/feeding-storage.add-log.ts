import { calculateNextFeedTime, type FeedingLog } from '../types/feeding-log.js';
import { settingsService } from './settings-service.js';

export async function addLogImpl(
  log: FeedingLog,
  loadLogs: () => Promise<FeedingLog[]>,
  saveLogs: (logs: FeedingLog[]) => Promise<void>
): Promise<void> {
  const logs = await loadLogs();

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

  await saveLogs(logs);
}
