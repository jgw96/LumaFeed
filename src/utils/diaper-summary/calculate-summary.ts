import type { DiaperLog, DiaperPeriodSummary, DiaperSummaryStats } from '../../types/diaper-log.js';

const HOUR_IN_MS = 60 * 60 * 1000;
const DAY_IN_MS = 24 * HOUR_IN_MS;

function createEmptyPeriodSummary(): DiaperPeriodSummary {
  return {
    wet: 0,
    dirty: 0,
    both: 0,
    total: 0,
  };
}

export function calculateDiaperSummary(logs: DiaperLog[]): DiaperSummaryStats {
  const now = Date.now();
  const last24Cutoff = now - DAY_IN_MS;
  const last7DaysCutoff = now - 7 * DAY_IN_MS;

  const last24Hours = createEmptyPeriodSummary();
  const last7Days = createEmptyPeriodSummary();

  let lastWetTime: number | null = null;
  let lastDirtyTime: number | null = null;

  const timestamps: number[] = [];

  for (const log of logs) {
    const timestamp = typeof log.timestamp === 'number' ? log.timestamp : Date.now();
    if (!Number.isFinite(timestamp)) {
      continue;
    }

    timestamps.push(timestamp);

    if (log.wet) {
      lastWetTime = lastWetTime === null ? timestamp : Math.max(lastWetTime, timestamp);
    }

    if (log.dirty) {
      lastDirtyTime = lastDirtyTime === null ? timestamp : Math.max(lastDirtyTime, timestamp);
    }

    if (timestamp >= last24Cutoff) {
      last24Hours.total += 1;
      if (log.wet && log.dirty) {
        last24Hours.both += 1;
      } else if (log.wet) {
        last24Hours.wet += 1;
      } else if (log.dirty) {
        last24Hours.dirty += 1;
      }
    }

    if (timestamp >= last7DaysCutoff) {
      last7Days.total += 1;
      if (log.wet && log.dirty) {
        last7Days.both += 1;
      } else if (log.wet) {
        last7Days.wet += 1;
      } else if (log.dirty) {
        last7Days.dirty += 1;
      }
    }
  }

  let averageIntervalMinutes: number | null = null;
  if (timestamps.length >= 2) {
    timestamps.sort((a, b) => a - b);

    const intervals: number[] = [];
    for (let i = 1; i < timestamps.length; i += 1) {
      const diff = timestamps[i] - timestamps[i - 1];
      if (diff > 0) {
        intervals.push(diff);
      }
    }

    if (intervals.length > 0) {
      const total = intervals.reduce((sum, diff) => sum + diff, 0);
      averageIntervalMinutes = Math.round(total / intervals.length / (60 * 1000));
    }
  }

  return {
    last24Hours,
    last7Days,
    lastWetTime,
    lastDirtyTime,
    averageIntervalMinutes,
  };
}
