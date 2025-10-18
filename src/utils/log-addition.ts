import type { FeedingLog } from '../types/feeding-log.js';
import type { AppToast } from '../components/app-toast.js';

/**
 * Handles the addition of a feeding log with storage save and toast notification.
 * This function is lazy-loaded to reduce initial bundle size.
 */
export async function handleLogAddition(
  log: FeedingLog,
  toastElement: AppToast | undefined,
  onSuccess: () => Promise<FeedingLog[]> | Promise<unknown>,
  onShowNotification?: (log: FeedingLog) => Promise<void>
): Promise<void> {
  try {
    const { feedingStorage } = await import('../services/feeding-storage.js');
    await feedingStorage.addLog(log);

    const logs = await onSuccess();
    const latestLog = Array.isArray(logs) && logs.length > 0 ? logs[0] : log;

    await showNextFeedToast(latestLog, toastElement, onShowNotification);
  } catch (error) {
    console.error('Failed to save log:', error);
    throw error;
  }
}

/**
 * Shows a toast notification for the next feed time.
 */
async function showNextFeedToast(
  log: FeedingLog,
  toastElement: AppToast | undefined,
  onShowNotification?: (log: FeedingLog) => Promise<void>
): Promise<void> {
  if (!log || typeof log.nextFeedTime !== 'number') {
    return;
  }

  const { formatNextFeedLabel } = await import('./feed-time.js');

  if (toastElement) {
    await toastElement.show({
      headline: 'Feeding saved',
      supporting: `Next feed around ${formatNextFeedLabel(log.nextFeedTime)}`,
      icon: '🕒',
    });
  }

  if (onShowNotification) {
    void onShowNotification(log);
  }
}
