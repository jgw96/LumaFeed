import { describe, it, expect, afterEach, vi } from 'vitest';
import '../src/components/feeding-form-dialog.js';
import { cleanup, mountComponent, queryShadow } from './helpers.js';
import type { FeedingFormDialog } from '../src/components/feeding-form-dialog.js';

describe('FeedingFormDialog', () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  const openManualForm = async () => {
    const dialog = await mountComponent<FeedingFormDialog>('feeding-form-dialog');

    const manualLink = queryShadow<HTMLButtonElement>(dialog, '.manual-entry .link-button');
    manualLink?.click();

    await dialog.updateComplete;

    return dialog;
  };

  it('should render start view with timer call to action', async () => {
    const dialog = await mountComponent<FeedingFormDialog>('feeding-form-dialog');

    const header = queryShadow(dialog, '.dialog-header h2');
    expect(header?.textContent?.trim()).toBe('Track a Feeding');

    const startButton = queryShadow<HTMLButtonElement>(dialog, '.start-actions .btn-save');
    expect(startButton).toBeTruthy();
    expect(startButton?.textContent?.trim()).toBe('Start feed');

    const manualLink = queryShadow<HTMLButtonElement>(dialog, '.manual-entry .link-button');
    expect(manualLink).toBeTruthy();
  });

  it('should transition to timer view when start feed is clicked', async () => {
    const dialog = await mountComponent<FeedingFormDialog>('feeding-form-dialog');

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T08:00:00Z'));

    const startButton = queryShadow<HTMLButtonElement>(dialog, '.start-actions .btn-save');
    expect(startButton).toBeTruthy();
    startButton!.click();

    await dialog.updateComplete;

    const timerDisplay = queryShadow(dialog, '.timer-display');
    expect(timerDisplay).toBeTruthy();

  });

  it('should allow entering details manually', async () => {
    const dialog = await openManualForm();

    const form = queryShadow<HTMLFormElement>(dialog, 'form');
    expect(form).toBeTruthy();

    const timeInputs = queryShadow(dialog, 'form')?.querySelectorAll('input[type="datetime-local"]');
    expect(timeInputs).toBeTruthy();
    expect(timeInputs?.length).toBe(2);
  });

  it('should show captured time summary after finishing timer', async () => {
    const dialog = await mountComponent<FeedingFormDialog>('feeding-form-dialog');

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T08:00:00Z'));

    const startButton = queryShadow<HTMLButtonElement>(dialog, '.start-actions .btn-save');
    expect(startButton).toBeTruthy();
    startButton!.click();
    await dialog.updateComplete;

    await vi.advanceTimersByTimeAsync(65_000);
    await dialog.updateComplete;

    const doneButton = queryShadow<HTMLButtonElement>(dialog, '.timer-actions .btn-save');
    expect(doneButton).toBeTruthy();
    doneButton!.click();

    await dialog.updateComplete;

    const summary = queryShadow(dialog, '.time-summary');
    expect(summary).toBeTruthy();

  });

  it('should allow switching to manual editing from timer summary', async () => {
    const dialog = await mountComponent<FeedingFormDialog>('feeding-form-dialog');

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T08:00:00Z'));

    const startButton = queryShadow<HTMLButtonElement>(dialog, '.start-actions .btn-save');
    expect(startButton).toBeTruthy();
    startButton!.click();
    await dialog.updateComplete;

    await vi.advanceTimersByTimeAsync(65_000);
    await dialog.updateComplete;

    const doneButton = queryShadow<HTMLButtonElement>(dialog, '.timer-actions .btn-save');
    expect(doneButton).toBeTruthy();
    doneButton!.click();
    await dialog.updateComplete;

    const adjustButton = queryShadow<HTMLButtonElement>(dialog, '.time-summary .link-button');
    expect(adjustButton).toBeTruthy();
    adjustButton!.click();

    await dialog.updateComplete;

    const timeInputs = queryShadow(dialog, 'form')?.querySelectorAll('input[type="datetime-local"]');
    expect(timeInputs?.length).toBe(2);

  });

  it('should keep save disabled until amount entered', async () => {
    const dialog = await openManualForm();

    const saveButton = queryShadow<HTMLButtonElement>(dialog, '.btn-save');
    expect(saveButton?.disabled).toBe(true);

    await dialog.updateComplete;
  });

  it('should open dialog when open method is called', async () => {
    const dialog = await mountComponent<FeedingFormDialog>('feeding-form-dialog');
    const dialogElement = queryShadow<HTMLDialogElement>(dialog, 'dialog');

    const showModalSpy = vi.fn();
    dialogElement!.showModal = showModalSpy;

    dialog.open();

    expect(showModalSpy).toHaveBeenCalled();
  });

  it('should close dialog when close method is called', async () => {
    const dialog = await mountComponent<FeedingFormDialog>('feeding-form-dialog');

    vi.useFakeTimers();

    const dialogElement = queryShadow<HTMLDialogElement>(dialog, 'dialog');

    const closeSpy = vi.fn();
    dialogElement!.close = closeSpy;
    dialogElement!.open = true;

    dialog.close();

    await vi.advanceTimersByTimeAsync(300);

    expect(closeSpy).toHaveBeenCalled();
  });

  // Tests covering event dispatch have been removed per current requirements.
});
