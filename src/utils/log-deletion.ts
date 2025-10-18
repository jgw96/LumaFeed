import type { ConfirmDialog } from '../components/confirm-dialog.js';

/**
 * Handles the deletion of a feeding log with confirmation dialog.
 * This function is lazy-loaded to reduce initial bundle size.
 */
export async function handleLogDeletion(
  logId: string,
  confirmDialog: ConfirmDialog,
  onSuccess: () => Promise<void> | Promise<unknown>
): Promise<void> {
  const confirmed = await confirmDialog.show({
    headline: 'Delete feeding log?',
    supportingText: 'This action cannot be undone.',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    confirmDestructive: true,
  });

  if (!confirmed) {
    return;
  }

  try {
    const { feedingStorage } = await import('../services/feeding-storage.js');
    await feedingStorage.deleteLog(logId);
    await onSuccess();
  } catch (error) {
    console.error('Failed to delete log:', error);
    throw error;
  }
}
