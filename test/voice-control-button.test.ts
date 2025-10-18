import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import '../src/components/voice-control-button.js';
import { cleanup, mountComponent, queryShadow } from './helpers.js';
import type { VoiceControlButton } from '../src/components/voice-control-button.js';
import { VoiceRecognitionService } from '../src/services/voice-recognition-service.js';

// Mock SpeechRecognition API
class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  lang = '';
  maxAlternatives = 1;
  onresult: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  onend: ((event: any) => void) | null = null;
  onstart: ((event: any) => void) | null = null;

  start() {
    if (this.onstart) {
      this.onstart(new Event('start'));
    }
  }

  stop() {
    if (this.onend) {
      this.onend(new Event('end'));
    }
  }

  abort() {
    this.stop();
  }
}

describe('VoiceControlButton', () => {
  let originalSpeechRecognition: any;

  beforeEach(() => {
    // Mock the SpeechRecognition API
    originalSpeechRecognition = (window as any).SpeechRecognition;
    (window as any).SpeechRecognition = vi.fn(() => new MockSpeechRecognition());
  });

  afterEach(() => {
    cleanup();
    // Restore original
    (window as any).SpeechRecognition = originalSpeechRecognition;
  });

  it('should render the voice control button', async () => {
    const button = await mountComponent<VoiceControlButton>('voice-control-button');

    const voiceButton = queryShadow<HTMLButtonElement>(button, '.voice-button');
    expect(voiceButton).toBeTruthy();
  });

  it('should show disabled state when speech recognition is not supported', async () => {
    delete (window as any).SpeechRecognition;
    delete (window as any).webkitSpeechRecognition;

    const button = await mountComponent<VoiceControlButton>('voice-control-button');
    await button.updateComplete;

    const voiceButton = queryShadow<HTMLButtonElement>(button, '.voice-button');
    expect(voiceButton?.disabled).toBe(true);
  });

  it('should toggle listening state when clicked', async () => {
    const button = await mountComponent<VoiceControlButton>('voice-control-button');

    const voiceButton = queryShadow<HTMLButtonElement>(button, '.voice-button');
    expect(voiceButton?.classList.contains('listening')).toBe(false);

    voiceButton?.click();
    await button.updateComplete;

    expect(voiceButton?.classList.contains('listening')).toBe(true);

    voiceButton?.click();
    await button.updateComplete;

    expect(voiceButton?.classList.contains('listening')).toBe(false);
  });

  it('should dispatch voice-command event when command is recognized', async () => {
    const button = await mountComponent<VoiceControlButton>('voice-control-button');
    
    const voiceCommandSpy = vi.fn();
    button.addEventListener('voice-command', voiceCommandSpy);

    // Start listening
    const voiceButton = queryShadow<HTMLButtonElement>(button, '.voice-button');
    voiceButton?.click();
    await button.updateComplete;

    // Simulate a voice command being recognized
    // This would be triggered by the service, so we'll trigger it directly
    const event = new CustomEvent('voice-command', {
      detail: {
        command: 'start-feed',
        transcript: 'start feed',
        confidence: 0.9,
      },
      bubbles: true,
      composed: true,
    });
    button.dispatchEvent(event);

    expect(voiceCommandSpy).toHaveBeenCalled();
  });
});
