import type { DiaperChartPoint, DiaperLog } from '../../types/diaper-log.js';

const HOUR_IN_MS = 60 * 60 * 1000;

export interface BuildDiaperChartDataOptions {
  hoursSpan?: number;
  bucketSizeHours?: number;
}

export function buildDiaperChartData(
  logs: DiaperLog[],
  options: BuildDiaperChartDataOptions = {}
): DiaperChartPoint[] {
  const hoursSpan = options.hoursSpan && options.hoursSpan > 0 ? options.hoursSpan : 48;
  const bucketSizeHours =
    options.bucketSizeHours && options.bucketSizeHours > 0 ? options.bucketSizeHours : 6;

  const bucketMs = bucketSizeHours * HOUR_IN_MS;
  const bucketCount = Math.ceil(hoursSpan / bucketSizeHours);
  const now = Date.now();
  const start = now - hoursSpan * HOUR_IN_MS;

  const buckets: DiaperChartPoint[] = Array.from({ length: bucketCount }, (_, index) => {
    const bucketStart = start + index * bucketMs;
    return {
      timestamp: bucketStart,
      wet: 0,
      dirty: 0,
      both: 0,
      total: 0,
    };
  });

  for (const log of logs) {
    const timestamp = typeof log.timestamp === 'number' ? log.timestamp : Date.now();
    if (!Number.isFinite(timestamp) || timestamp < start) {
      continue;
    }

    const bucketIndex = Math.min(buckets.length - 1, Math.floor((timestamp - start) / bucketMs));
    const bucket = buckets[bucketIndex];

    if (log.wet && log.dirty) {
      bucket.both += 1;
    } else if (log.wet) {
      bucket.wet += 1;
    } else if (log.dirty) {
      bucket.dirty += 1;
    }

    bucket.total += 1;
  }

  const trimmed = buckets.filter((bucket, index) => {
    if (bucket.total > 0) {
      return true;
    }

    // Keep the last bucket to provide context even if zero
    return index === buckets.length - 1;
  });

  return trimmed;
}
