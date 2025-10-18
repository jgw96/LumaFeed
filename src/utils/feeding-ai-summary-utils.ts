import type { FeedingLog } from '../types/feeding-log.js';

const AI_SUMMARY_SYSTEM_PROMPT = `You are an encouraging infant-feeding assistant. Summarize the caregiver's last 24 hours of bottle feeds in UNDER 70 WORDS spread across no more than two sentences. Highlight positives, mention any gentle watch-outs, and remind them to consult a pediatrician for medical decisions.`;
const AI_FEEDING_GUIDELINES = `General reference ranges (bottle feeding): 0-1 month: 60-90 ml (2-3 oz) every 3-4 hours; 1-2 months: 90-120 ml (3-4 oz) every 3-4 hours; 2-4 months: 120-150 ml (4-5 oz) every 3-4 hours. Babies vary - use the data as a guide, not a diagnosis.`;
const AI_SYSTEM_CONTEXT = `${AI_SUMMARY_SYSTEM_PROMPT}\n\nReference guidance:\n${AI_FEEDING_GUIDELINES}`;

function computeFeedStats(logs: FeedingLog[]) {
  const totalMl = logs.reduce((sum, log) => sum + (log.amountMl ?? 0), 0);
  const totalOz = logs.reduce((sum, log) => sum + (log.amountOz ?? 0), 0);
  const totalDuration = logs.reduce((sum, log) => sum + (log.durationMinutes ?? 0), 0);
  const sorted = [...logs].sort((a, b) => a.startTime - b.startTime);

  let accumulatedIntervals = 0;
  for (let i = 1; i < sorted.length; i += 1) {
    accumulatedIntervals += sorted[i].startTime - sorted[i - 1].startTime;
  }

  const averageIntervalMinutes =
    sorted.length > 1 ? accumulatedIntervals / (sorted.length - 1) / 60_000 : null;

  return {
    feedCount: logs.length,
    totalMl,
    totalOz,
    averageMl: logs.length ? totalMl / logs.length : 0,
    averageOz: logs.length ? totalOz / logs.length : 0,
    averageDuration: logs.length ? totalDuration / logs.length : 0,
    averageIntervalMinutes,
    bottleFeeds: logs.filter((log) => log.isBottleFed).length,
    nursingFeeds: logs.filter((log) => !log.isBottleFed).length,
  };
}

function formatNumber(value: number, decimals: number = 1): string {
  if (!Number.isFinite(value)) {
    return '0';
  }

  const formatter = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return formatter.format(value);
}

function formatMinutes(value: number | null): string {
  if (!Number.isFinite(value) || value === null) {
    return 'N/A';
  }

  const rounded = Math.round(value);
  const hours = Math.floor(rounded / 60);
  const minutes = rounded % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

function formatClock(timestamp: number): string {
  const formatter = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

  return formatter.format(new Date(timestamp));
}

export function buildAiSummaryPrompt(logs: FeedingLog[]): string {
  const stats = computeFeedStats(logs);
  const details = logs
    .slice()
    .sort((a, b) => a.startTime - b.startTime)
    .map((log) => {
      const amountMl = formatNumber(log.amountMl ?? 0, 0);
      const amountOz = formatNumber(log.amountOz ?? 0, 1);
      const duration = formatMinutes(log.durationMinutes ?? null);
      const label = log.feedType === 'formula' ? 'Formula bottle' : 'Breast milk';
      const timing = formatClock(log.startTime);
      return `- ${timing}: ${label}, ${amountMl} ml (${amountOz} oz), duration ${duration}`;
    })
    .join('\n');

  const averageInterval = formatMinutes(stats.averageIntervalMinutes);
  const averageDuration = formatMinutes(stats.averageDuration);

  return [
    'You are helping a caregiver review feeding logs for the last 24 hours.',
  `Reference guidance: ${AI_FEEDING_GUIDELINES}`,
    `Summary statistics:\n- Total feeds: ${stats.feedCount}\n- Bottle feeds: ${stats.bottleFeeds}\n- Nursing sessions: ${stats.nursingFeeds}\n- Total intake: ${formatNumber(stats.totalMl, 0)} ml (${formatNumber(stats.totalOz, 1)} oz)\n- Average intake per feed: ${formatNumber(stats.averageMl, 0)} ml (${formatNumber(stats.averageOz, 1)} oz)\n- Average duration: ${averageDuration}\n- Average interval: ${averageInterval}`,
    `Detailed entries:\n${details}`,
    'Create a short, upbeat summary mentioning positive trends and any gentle watch-outs. End with a reminder that caregivers should consult healthcare professionals for specific advice.',
  ].join('\n\n');
}

export function enforceAiSummaryLength(text: string, maxWords: number = 70): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) {
    return text.trim();
  }

  const shortened = words.slice(0, maxWords).join(' ');
  return `${shortened}…`;
}

export { AI_FEEDING_GUIDELINES, AI_SYSTEM_CONTEXT };
