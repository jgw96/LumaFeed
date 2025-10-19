import type { FeedingLog } from '../../types/feeding-log.js';

export function resolveNextFeedTime(logs: FeedingLog[]): number | undefined {
  if (!Array.isArray(logs) || logs.length === 0) {
    return undefined;
  }

  let latestLog: FeedingLog | undefined;
  let latestCompletedAt = Number.NEGATIVE_INFINITY;

  for (const log of logs) {
    const completedAt = typeof log.endTime === 'number' ? log.endTime : log.timestamp;
    if (
      typeof completedAt === 'number' &&
      Number.isFinite(completedAt) &&
      (latestLog === undefined || completedAt > latestCompletedAt)
    ) {
      latestLog = log;
      latestCompletedAt = completedAt;
    }
  }

  const candidate =
    typeof latestLog?.nextFeedTime === 'number' ? latestLog.nextFeedTime : undefined;
  return Number.isFinite(candidate) ? candidate : undefined;
}
