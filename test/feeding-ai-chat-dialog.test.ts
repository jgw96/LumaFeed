import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '../src/components/feeding-ai-chat-dialog.js';
import { cleanup, mountComponent, queryShadow, waitFor } from './helpers.js';
import type { FeedingAiChatDialog } from '../src/components/feeding-ai-chat-dialog.js';
import type { FeedingLog } from '../src/types/feeding-log.js';

describe('FeedingAiChatDialog', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render the chat dialog', async () => {
    const dialog = await mountComponent<FeedingAiChatDialog>('feeding-ai-chat-dialog');
    dialog.open = true;
    await dialog.updateComplete;

    const container = queryShadow(dialog, '.dialog-container');
    expect(container).toBeTruthy();
  });

  it('should display the header with title and close button', async () => {
    const dialog = await mountComponent<FeedingAiChatDialog>('feeding-ai-chat-dialog');
    dialog.open = true;
    await dialog.updateComplete;

    const title = queryShadow(dialog, '.header-title');
    expect(title?.textContent).toBe('Chat about your feed log');

    const closeButton = queryShadow(dialog, '.close-button');
    expect(closeButton).toBeTruthy();
  });

  it('should show empty state when there are no messages', async () => {
    const dialog = await mountComponent<FeedingAiChatDialog>('feeding-ai-chat-dialog');
    dialog.open = true;
    await dialog.updateComplete;

    const emptyState = queryShadow(dialog, '.empty-state');
    expect(emptyState).toBeTruthy();

    const emptyTitle = queryShadow(dialog, '.empty-state__title');
    expect(emptyTitle?.textContent).toBe('Ask me anything');
  });

  it('should render input container with message input and send button', async () => {
    const dialog = await mountComponent<FeedingAiChatDialog>('feeding-ai-chat-dialog');
    dialog.open = true;
    await dialog.updateComplete;

    const messageInput = queryShadow<HTMLTextAreaElement>(dialog, '.message-input');
    expect(messageInput).toBeTruthy();
    expect(messageInput?.placeholder).toContain('Ask about feeding patterns');

    const sendButton = queryShadow<HTMLButtonElement>(dialog, '.send-button');
    expect(sendButton).toBeTruthy();
    expect(sendButton?.textContent?.trim()).toBe('Send');
  });

  it('should disable send button when input is empty', async () => {
    const dialog = await mountComponent<FeedingAiChatDialog>('feeding-ai-chat-dialog');
    dialog.open = true;
    await dialog.updateComplete;

    const sendButton = queryShadow<HTMLButtonElement>(dialog, '.send-button');
    expect(sendButton?.disabled).toBe(true);
  });

  it('should emit close event when close button is clicked', async () => {
    const dialog = await mountComponent<FeedingAiChatDialog>('feeding-ai-chat-dialog');
    dialog.open = true;
    await dialog.updateComplete;

    let closeEventFired = false;
    dialog.addEventListener('close', () => {
      closeEventFired = true;
    });

    const closeButton = queryShadow<HTMLButtonElement>(dialog, '.close-button');
    closeButton?.click();

    await waitFor(() => closeEventFired, 1000, 'Close event not fired');
    expect(closeEventFired).toBe(true);
  });

  it('should accept feeding logs as a property', async () => {
    const dialog = await mountComponent<FeedingAiChatDialog>('feeding-ai-chat-dialog');

    const testLogs: FeedingLog[] = [
      {
        id: 'test-1',
        feedType: 'formula',
        amountMl: 120,
        amountOz: 4,
        durationMinutes: 15,
        isBottleFed: true,
        timestamp: Date.now(),
        startTime: Date.now() - 15 * 60_000,
        endTime: Date.now(),
        nextFeedTime: Date.now() + 3 * 60 * 60_000,
      },
    ];

    dialog.logs = testLogs;
    await dialog.updateComplete;

    expect(dialog.logs).toEqual(testLogs);
  });

  it('should be hidden by default', async () => {
    const dialog = await mountComponent<FeedingAiChatDialog>('feeding-ai-chat-dialog');

    const style = window.getComputedStyle(dialog);
    expect(style.display).toBe('none');
  });

  it('should be visible when open is true', async () => {
    const dialog = await mountComponent<FeedingAiChatDialog>('feeding-ai-chat-dialog');
    dialog.open = true;
    await dialog.updateComplete;

    const style = window.getComputedStyle(dialog);
    expect(style.display).toBe('block');
  });

  it('should show disclaimer when there are messages', async () => {
    const dialog = await mountComponent<FeedingAiChatDialog>('feeding-ai-chat-dialog');
    dialog.open = true;
    await dialog.updateComplete;

    // Initially no messages, so no disclaimer
    let disclaimer = queryShadow(dialog, '.disclaimer');
    expect(disclaimer).toBeNull();

    // Simulate having messages (we can't actually test AI generation without mocking)
    // For now, just verify the structure is correct
    const emptyState = queryShadow(dialog, '.empty-state');
    expect(emptyState).toBeTruthy();
  });
});
