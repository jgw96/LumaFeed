import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest';
import '../src/components/pwa-install-prompt.js';
import { cleanup, mountComponent, queryShadow, waitFor } from './helpers.js';
import type { PWAInstallPrompt } from '../src/components/pwa-install-prompt.js';

describe('PWAInstallPrompt', () => {
  afterEach(() => {
    cleanup();
    sessionStorage.clear();
  });

  beforeEach(() => {
    // Reset sessionStorage
    sessionStorage.clear();
  });

  it('should render but be hidden by default', async () => {
    const prompt = await mountComponent<PWAInstallPrompt>('pwa-install-prompt');
    
    // Component should render
    expect(prompt).toBeTruthy();
    
    // But the prompt itself should not be visible initially
    const promptEl = queryShadow(prompt, '.prompt');
    expect(promptEl).toBeFalsy();
  });

  it('should not show if already dismissed', async () => {
    sessionStorage.setItem('pwa-install-dismissed', 'true');
    
    const prompt = await mountComponent<PWAInstallPrompt>('pwa-install-prompt');
    
    await waitFor(() => {
      const promptEl = queryShadow(prompt, '.prompt');
      return promptEl === null;
    }, 4000, 'Prompt should not appear when dismissed');
    
    const promptEl = queryShadow(prompt, '.prompt');
    expect(promptEl).toBeFalsy();
  });

  it('should hide when close button is clicked', async () => {
    const prompt = await mountComponent<PWAInstallPrompt>('pwa-install-prompt');
    
    // Manually trigger visibility for testing
    (prompt as any).visible = true;
    await prompt.updateComplete;
    
    const closeBtn = queryShadow<HTMLButtonElement>(prompt, '.prompt__close');
    expect(closeBtn).toBeTruthy();
    
    closeBtn?.click();
    await prompt.updateComplete;
    
    // Check that dismissed flag is set
    expect(sessionStorage.getItem('pwa-install-dismissed')).toBe('true');
  });

  it('should render install button for Chromium browsers', async () => {
    const prompt = await mountComponent<PWAInstallPrompt>('pwa-install-prompt');
    
    // Set component to visible and non-iOS
    (prompt as any).visible = true;
    (prompt as any).isIOS = false;
    await prompt.updateComplete;
    
    const installBtn = queryShadow<HTMLButtonElement>(prompt, '.prompt__button--filled');
    expect(installBtn).toBeTruthy();
    expect(installBtn?.textContent?.trim()).toBe('Install');
  });

  it('should render iOS instructions for iOS devices', async () => {
    const prompt = await mountComponent<PWAInstallPrompt>('pwa-install-prompt');
    
    // Simulate iOS
    (prompt as any).visible = true;
    (prompt as any).isIOS = true;
    await prompt.updateComplete;
    
    const instructions = queryShadow(prompt, '.ios-instructions');
    expect(instructions).toBeTruthy();
    
    const steps = queryShadow(prompt, '.ios-instructions__steps');
    expect(steps).toBeTruthy();
  });

  it('should show app name and icon', async () => {
    const prompt = await mountComponent<PWAInstallPrompt>('pwa-install-prompt');
    
    (prompt as any).visible = true;
    await prompt.updateComplete;
    
    const title = queryShadow(prompt, '.prompt__title');
    expect(title?.textContent).toContain('LumaFeed');
    
    const icon = queryShadow<HTMLImageElement>(prompt, '.prompt__icon img');
    expect(icon).toBeTruthy();
    expect(icon?.src).toContain('maskable_icon_x128.png');
  });

  it('should handle install action when install button is clicked', async () => {
    const prompt = await mountComponent<PWAInstallPrompt>('pwa-install-prompt');
    
    // Mock the deferred prompt
    const mockPrompt = vi.fn();
    const mockUserChoice = Promise.resolve({ outcome: 'accepted' as const, platform: 'web' });
    (prompt as any).deferredPrompt = {
      prompt: mockPrompt,
      userChoice: mockUserChoice
    };
    (prompt as any).visible = true;
    (prompt as any).isIOS = false;
    await prompt.updateComplete;
    
    const installBtn = queryShadow<HTMLButtonElement>(prompt, '.prompt__button--filled');
    installBtn?.click();
    
    await waitFor(() => mockPrompt.mock.calls.length > 0, 1000, 'Prompt should be called');
    
    expect(mockPrompt).toHaveBeenCalled();
  });

  it('should hide prompt after successful install', async () => {
    const prompt = await mountComponent<PWAInstallPrompt>('pwa-install-prompt');
    
    const mockPrompt = vi.fn();
    const mockUserChoice = Promise.resolve({ outcome: 'accepted' as const, platform: 'web' });
    (prompt as any).deferredPrompt = {
      prompt: mockPrompt,
      userChoice: mockUserChoice
    };
    (prompt as any).visible = true;
    await prompt.updateComplete;
    
    const installBtn = queryShadow<HTMLButtonElement>(prompt, '.prompt__button--filled');
    installBtn?.click();
    
    // Wait for the install process to complete
    await mockUserChoice;
    await prompt.updateComplete;
    
    // Prompt should be hidden
    const promptEl = queryShadow(prompt, '.prompt--visible');
    expect(promptEl).toBeFalsy();
  });

  it('should handle "Not now" button click', async () => {
    const prompt = await mountComponent<PWAInstallPrompt>('pwa-install-prompt');
    
    (prompt as any).visible = true;
    (prompt as any).isIOS = false;
    await prompt.updateComplete;
    
    const notNowBtn = queryShadow<HTMLButtonElement>(prompt, '.prompt__button--text');
    expect(notNowBtn?.textContent?.trim()).toBe('Not now');
    
    notNowBtn?.click();
    await prompt.updateComplete;
    
    // Should set dismissed flag
    expect(sessionStorage.getItem('pwa-install-dismissed')).toBe('true');
  });
});
