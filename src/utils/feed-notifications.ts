import type { FeedingLog } from '../types/feeding-log.js';

/**
 * Attempts to show a notification for the next feed time.
 * This function is lazy-loaded to reduce initial bundle size.
 * Requires notification permissions and tries both service worker and direct notifications.
 */
export async function showNextFeedNotification(log: FeedingLog): Promise<void> {
  if (!('Notification' in window) || typeof log.nextFeedTime !== 'number') {
    return;
  }

  let permission: NotificationPermission = Notification.permission;

  if (permission === 'default') {
    try {
      permission = await Notification.requestPermission();
    } catch (error) {
      console.warn('Requesting notification permission failed', error);
      return;
    }
  }

  if (permission !== 'granted') {
    return;
  }

  const { formatNextFeedLabel } = await import('./feed-time.js');

  const notificationOptions: NotificationOptions = {
    body: `Next feed around ${formatNextFeedLabel(log.nextFeedTime)}`,
    tag: 'next-feed-reminder',
    icon: '/maskable_icon_x512.png',
    badge: '/monochrome.png',
    data: { logId: log.id ?? null, nextFeedTime: log.nextFeedTime },
  };

  try {
    const registration = await navigator.serviceWorker?.ready;
    if (registration) {
      await registration.showNotification('Feeding saved', notificationOptions);
      return;
    }
  } catch (error) {
    console.warn('Service worker notification failed', error);
  }

  try {
    new Notification('Feeding saved', notificationOptions);
  } catch (error) {
    console.warn('Direct notification failed', error);
  }
}
