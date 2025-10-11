const FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
};

const DAY_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
};

const getDayLabel = (target: Date, reference: Date): string => {
  const referenceDay = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate());
  const tomorrow = new Date(referenceDay);
  tomorrow.setDate(referenceDay.getDate() + 1);

  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());

  if (targetDay.getTime() === referenceDay.getTime()) {
    return 'Today';
  }

  if (targetDay.getTime() === tomorrow.getTime()) {
    return 'Tomorrow';
  }

  return target.toLocaleDateString('en-US', DAY_FORMAT_OPTIONS);
};

export function formatNextFeedLabel(nextFeedTime: number, now: number = Date.now()): string {
  const nextFeed = new Date(nextFeedTime);
  if (!Number.isFinite(nextFeedTime) || Number.isNaN(nextFeed.getTime())) {
    return '—';
  }

  const reference = new Date(now);
  const dayLabel = getDayLabel(nextFeed, reference);
  const timeLabel = nextFeed.toLocaleTimeString('en-US', FORMAT_OPTIONS);
  return `${dayLabel} · ${timeLabel}`;
}
