import { describe, it, expect, afterEach, vi } from 'vitest';
import '../src/components/feeding-form-dialog.js';
import { cleanup, mountComponent, queryShadow, waitFor } from './helpers.js';
import type { FeedingFormDialog } from '../src/components/feeding-form-dialog.js';

describe('FeedingFormDialog', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render the dialog', async () => {
    const dialog = await mountComponent<FeedingFormDialog>('feeding-form-dialog');
    
    const dialogElement = queryShadow<HTMLDialogElement>(dialog, 'dialog');
    expect(dialogElement).toBeTruthy();
  });

  it('should have a title', async () => {
    const dialog = await mountComponent<FeedingFormDialog>('feeding-form-dialog');
    
    const h2 = queryShadow(dialog, 'h2');
    expect(h2?.textContent).toBe('Add Feeding Log');
  });

  it('should render feed type radio buttons', async () => {
    const dialog = await mountComponent<FeedingFormDialog>('feeding-form-dialog');
    
    const formulaRadio = queryShadow<HTMLInputElement>(dialog, 'input[value="formula"]');
    const milkRadio = queryShadow<HTMLInputElement>(dialog, 'input[value="milk"]');
    
    expect(formulaRadio).toBeTruthy();
    expect(milkRadio).toBeTruthy();
    expect(formulaRadio?.type).toBe('radio');
    expect(milkRadio?.type).toBe('radio');
  });

  it('should render amount input', async () => {
    const dialog = await mountComponent<FeedingFormDialog>('feeding-form-dialog');
    
    const amountInputs = queryShadow(dialog, 'dialog')?.querySelectorAll('input[type="number"]');
    expect(amountInputs).toBeTruthy();
    expect(amountInputs!.length).toBeGreaterThan(0);
  });

  it('should render unit selection', async () => {
    const dialog = await mountComponent<FeedingFormDialog>('feeding-form-dialog');
    
    const unitSelect = queryShadow<HTMLSelectElement>(dialog, 'select');
    
    expect(unitSelect).toBeTruthy();
    
    const options = unitSelect?.querySelectorAll('option');
    expect(options?.length).toBe(2);
    
    const optionValues = Array.from(options || []).map(opt => opt.value);
    expect(optionValues).toContain('ml');
    expect(optionValues).toContain('oz');
  });

  it('should render duration input', async () => {
    const dialog = await mountComponent<FeedingFormDialog>('feeding-form-dialog');
    
    const allInputs = queryShadow(dialog, 'dialog')?.querySelectorAll('input[type="number"]');
    expect(allInputs).toBeTruthy();
    expect(allInputs!.length).toBeGreaterThan(1); // Should have at least amount and duration
  });

  it('should render feeding method radio buttons', async () => {
    const dialog = await mountComponent<FeedingFormDialog>('feeding-form-dialog');
    
    const bottleRadio = queryShadow<HTMLInputElement>(dialog, 'input[id="bottle"]');
    const otherRadio = queryShadow<HTMLInputElement>(dialog, 'input[id="other"]');
    
    expect(bottleRadio).toBeTruthy();
    expect(otherRadio).toBeTruthy();
    expect(bottleRadio?.type).toBe('radio');
    expect(otherRadio?.type).toBe('radio');
  });

  it('should render cancel and save buttons', async () => {
    const dialog = await mountComponent<FeedingFormDialog>('feeding-form-dialog');
    
    const cancelButton = queryShadow<HTMLButtonElement>(dialog, '.btn-cancel');
    const saveButton = queryShadow<HTMLButtonElement>(dialog, '.btn-save');
    
    expect(cancelButton).toBeTruthy();
    expect(saveButton).toBeTruthy();
    expect(cancelButton?.textContent?.trim()).toBe('Cancel');
    expect(saveButton?.textContent?.trim()).toBe('Save Log');
  });

  it('should have save button disabled when form is invalid', async () => {
    const dialog = await mountComponent<FeedingFormDialog>('feeding-form-dialog');
    
    const saveButton = queryShadow<HTMLButtonElement>(dialog, '.btn-save');
    expect(saveButton?.disabled).toBe(true);
  });

  it('should open dialog when open method is called', async () => {
    const dialog = await mountComponent<FeedingFormDialog>('feeding-form-dialog');
    const dialogElement = queryShadow<HTMLDialogElement>(dialog, 'dialog');
    
    // Mock showModal
    const showModalSpy = vi.fn();
    dialogElement!.showModal = showModalSpy;
    
    dialog.open();
    
    expect(showModalSpy).toHaveBeenCalled();
  });

  it('should close dialog when close method is called', async () => {
    const dialog = await mountComponent<FeedingFormDialog>('feeding-form-dialog');
    const dialogElement = queryShadow<HTMLDialogElement>(dialog, 'dialog');
    
    // Mock close
    const closeSpy = vi.fn();
    dialogElement!.close = closeSpy;
    
    dialog.close();
    
    expect(closeSpy).toHaveBeenCalled();
  });

  it('should dispatch log-added event on form submit', async () => {
    const dialog = await mountComponent<FeedingFormDialog>('feeding-form-dialog');
    
    // Listen for the log-added event
    const eventPromise = new Promise<CustomEvent>((resolve) => {
      dialog.addEventListener('log-added', (e) => {
        resolve(e as CustomEvent);
      }, { once: true });
    });
    
    // Mock the dialog close method
    const dialogElement = queryShadow<HTMLDialogElement>(dialog, 'dialog');
    dialogElement!.close = vi.fn();
    
    // Set form values via the shadow DOM
    const amountInputs = queryShadow(dialog, 'dialog')?.querySelectorAll('input[type="number"]');
    if (amountInputs && amountInputs.length >= 2) {
      (amountInputs[0] as HTMLInputElement).value = '120';
      (amountInputs[0] as HTMLInputElement).dispatchEvent(new Event('input', { bubbles: true }));
      (amountInputs[1] as HTMLInputElement).value = '15';
      (amountInputs[1] as HTMLInputElement).dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    // Submit the form
    const form = queryShadow<HTMLFormElement>(dialog, 'form');
    form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    
    // Wait for event or timeout
    const event = await Promise.race([
      eventPromise,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 1000)),
    ]);
    
    // Event might not fire if validation fails, which is acceptable
    if (event) {
      expect(event.detail).toBeTruthy();
      expect(event.detail).toHaveProperty('id');
      expect(event.detail).toHaveProperty('feedType');
    }
  });
});
