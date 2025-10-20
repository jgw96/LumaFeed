import { describe, it, expect, beforeEach } from 'vitest';
import { ConfirmDialog } from '../src/components/confirm-dialog.js';
import { cleanup, mountComponent, queryShadow } from './helpers.js';

describe('ConfirmDialog', () => {
  let dialog: ConfirmDialog;

  beforeEach(async () => {
    if (!customElements.get('confirm-dialog')) {
      customElements.define('confirm-dialog', ConfirmDialog);
    }
    dialog = await mountComponent<ConfirmDialog>('confirm-dialog');
  });

  afterEach(() => {
    cleanup();
  });

  it('should render without errors', () => {
    expect(dialog).toBeTruthy();
  });

  it('should be hidden by default', () => {
    expect(dialog.open).toBe(false);
    expect(dialog.hasAttribute('open')).toBe(false);
  });

  it('should show dialog when show() is called', async () => {
    const promise = dialog.show({
      headline: 'Test Headline',
      supportingText: 'Test supporting text',
    });

    await dialog.updateComplete;

    expect(dialog.open).toBe(true);
    expect(dialog.hasAttribute('open')).toBe(true);

    const headline = queryShadow<HTMLElement>(dialog, '.dialog__headline');
    expect(headline?.textContent).toBe('Test Headline');

    const supporting = queryShadow<HTMLElement>(dialog, '.dialog__supporting');
    expect(supporting?.textContent).toBe('Test supporting text');

    // Cancel to resolve the promise
    const cancelBtn = queryShadow<HTMLButtonElement>(dialog, '.dialog__button--cancel');
    cancelBtn?.click();

    const result = await promise;
    expect(result).toBe(false);
  });

  it('should resolve with true when confirm is clicked', async () => {
    const promise = dialog.show({
      headline: 'Confirm action',
      confirmText: 'Yes',
      cancelText: 'No',
    });

    await dialog.updateComplete;

    const confirmBtn = queryShadow<HTMLButtonElement>(dialog, '.dialog__button--confirm');
    confirmBtn?.click();

    const result = await promise;
    expect(result).toBe(true);
    expect(dialog.open).toBe(false);
  });

  it('should resolve with false when cancel is clicked', async () => {
    const promise = dialog.show({
      headline: 'Confirm action',
    });

    await dialog.updateComplete;

    const cancelBtn = queryShadow<HTMLButtonElement>(dialog, '.dialog__button--cancel');
    cancelBtn?.click();

    const result = await promise;
    expect(result).toBe(false);
    expect(dialog.open).toBe(false);
  });

  it('should use custom button text', async () => {
    const promise = dialog.show({
      headline: 'Delete?',
      confirmText: 'Delete',
      cancelText: 'Keep',
    });

    await dialog.updateComplete;

    const confirmBtn = queryShadow<HTMLButtonElement>(dialog, '.dialog__button--confirm');
    const cancelBtn = queryShadow<HTMLButtonElement>(dialog, '.dialog__button--cancel');

    expect(confirmBtn?.textContent?.trim()).toBe('Delete');
    expect(cancelBtn?.textContent?.trim()).toBe('Keep');

    cancelBtn?.click();
    await promise;
  });

  it('should apply destructive styling when confirmDestructive is true', async () => {
    const promise = dialog.show({
      headline: 'Delete permanently?',
      confirmDestructive: true,
    });

    await dialog.updateComplete;

    const confirmBtn = queryShadow<HTMLButtonElement>(dialog, '.dialog__button--confirm');
    expect(confirmBtn?.classList.contains('destructive')).toBe(true);

    const cancelBtn = queryShadow<HTMLButtonElement>(dialog, '.dialog__button--cancel');
    cancelBtn?.click();
    await promise;
  });

  it('should close on scrim click', async () => {
    const promise = dialog.show({
      headline: 'Test',
    });

    await dialog.updateComplete;

    const scrim = queryShadow<HTMLElement>(dialog, '.scrim');
    scrim?.click();

    const result = await promise;
    expect(result).toBe(false);
    expect(dialog.open).toBe(false);
  });

  it('should not close when clicking inside dialog', async () => {
    const promise = dialog.show({
      headline: 'Test',
    });

    await dialog.updateComplete;

    const dialogElement = queryShadow<HTMLElement>(dialog, '.dialog');
    dialogElement?.click();

    await dialog.updateComplete;
    expect(dialog.open).toBe(true);

    // Clean up
    const cancelBtn = queryShadow<HTMLButtonElement>(dialog, '.dialog__button--cancel');
    cancelBtn?.click();
    await promise;
  });
});
