export interface FeedingLog {
  id: string;
  feedType: 'formula' | 'milk';
  amountMl: number;
  amountOz: number;
  durationMinutes: number;
  isBottleFed: boolean;
  timestamp: number;
  startTime: number;
  endTime: number;
  nextFeedTime: number;
}

export type UnitType = 'ml' | 'oz';

export const DEFAULT_NEXT_FEED_INTERVAL_MINUTES = 180;

export function calculateNextFeedTime(
  baseTime: number,
  intervalMinutes: number = DEFAULT_NEXT_FEED_INTERVAL_MINUTES,
): number {
  const safeInterval = Number.isFinite(intervalMinutes) && intervalMinutes > 0
    ? intervalMinutes
    : DEFAULT_NEXT_FEED_INTERVAL_MINUTES;
  return baseTime + safeInterval * 60_000;
}
