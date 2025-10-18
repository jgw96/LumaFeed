import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  VoiceRecognitionService,
  type VoiceCommand,
  type VoiceRecognitionResult,
} from '../src/services/voice-recognition-service.js';

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

  // Helper method for testing
  simulateResult(transcript: string, confidence = 0.9, isFinal = true) {
    if (this.onresult) {
      const event = {
        results: {
          length: 1,
          item: (index: number) => this.createResult(transcript, confidence, isFinal),
          0: this.createResult(transcript, confidence, isFinal),
        },
        resultIndex: 0,
      };
      this.onresult(event);
    }
  }

  private createResult(transcript: string, confidence: number, isFinal: boolean) {
    return {
      length: 1,
      item: () => ({ transcript, confidence }),
      0: { transcript, confidence },
      isFinal,
    };
  }
}

describe('VoiceRecognitionService', () => {
  let mockRecognition: MockSpeechRecognition;
  let originalSpeechRecognition: any;

  beforeEach(() => {
    // Save original and mock the API
    originalSpeechRecognition = (window as any).SpeechRecognition;
    mockRecognition = new MockSpeechRecognition();
    (window as any).SpeechRecognition = vi.fn(() => mockRecognition);
  });

  afterEach(() => {
    // Restore original
    (window as any).SpeechRecognition = originalSpeechRecognition;
  });

  describe('isSupported', () => {
    it('should return true when SpeechRecognition is available', () => {
      expect(VoiceRecognitionService.isSupported()).toBe(true);
    });

    it('should return false when SpeechRecognition is not available', () => {
      delete (window as any).SpeechRecognition;
      delete (window as any).webkitSpeechRecognition;
      expect(VoiceRecognitionService.isSupported()).toBe(false);
    });
  });

  describe('command parsing', () => {
    let service: VoiceRecognitionService;
    let receivedCommands: VoiceRecognitionResult[];

    beforeEach(() => {
      service = new VoiceRecognitionService();
      receivedCommands = [];
      service.onCommand((result) => {
        receivedCommands.push(result);
      });
    });

    afterEach(() => {
      service.destroy();
    });

    it('should recognize "start feed" command', () => {
      service.start();
      mockRecognition.simulateResult('start feed');
      
      expect(receivedCommands).toHaveLength(1);
      expect(receivedCommands[0].command).toBe('start-feed');
      expect(receivedCommands[0].transcript).toBe('start feed');
    });

    it('should recognize "start feeding" command', () => {
      service.start();
      mockRecognition.simulateResult('start feeding');
      
      expect(receivedCommands).toHaveLength(1);
      expect(receivedCommands[0].command).toBe('start-feed');
    });

    it('should recognize "begin feed" command', () => {
      service.start();
      mockRecognition.simulateResult('begin feed');
      
      expect(receivedCommands).toHaveLength(1);
      expect(receivedCommands[0].command).toBe('start-feed');
    });

    it('should recognize "end feed" command', () => {
      service.start();
      mockRecognition.simulateResult('end feed');
      
      expect(receivedCommands).toHaveLength(1);
      expect(receivedCommands[0].command).toBe('end-feed');
    });

    it('should recognize "finish feeding" command', () => {
      service.start();
      mockRecognition.simulateResult('finish feeding');
      
      expect(receivedCommands).toHaveLength(1);
      expect(receivedCommands[0].command).toBe('end-feed');
    });

    it('should recognize "stop feed" command', () => {
      service.start();
      mockRecognition.simulateResult('stop feed');
      
      expect(receivedCommands).toHaveLength(1);
      expect(receivedCommands[0].command).toBe('end-feed');
    });

    it('should recognize "done feeding" command', () => {
      service.start();
      mockRecognition.simulateResult('done feeding');
      
      expect(receivedCommands).toHaveLength(1);
      expect(receivedCommands[0].command).toBe('end-feed');
    });

    it('should ignore unknown commands', () => {
      service.start();
      mockRecognition.simulateResult('hello world');
      
      expect(receivedCommands).toHaveLength(0);
    });

    it('should ignore non-final results', () => {
      service.start();
      mockRecognition.simulateResult('start feed', 0.9, false);
      
      expect(receivedCommands).toHaveLength(0);
    });

    it('should handle commands in longer phrases', () => {
      service.start();
      mockRecognition.simulateResult('hey please start feeding now');
      
      expect(receivedCommands).toHaveLength(1);
      expect(receivedCommands[0].command).toBe('start-feed');
    });
  });

  describe('lifecycle', () => {
    let service: VoiceRecognitionService;

    beforeEach(() => {
      service = new VoiceRecognitionService();
    });

    afterEach(() => {
      service.destroy();
    });

    it('should start listening', () => {
      service.start();
      expect(service.getIsListening()).toBe(true);
    });

    it('should stop listening', () => {
      service.start();
      service.stop();
      expect(service.getIsListening()).toBe(false);
    });

    it('should allow registering callbacks', () => {
      const callback = vi.fn();
      const unsubscribe = service.onCommand(callback);

      service.start();
      mockRecognition.simulateResult('start feed');

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          command: 'start-feed',
          transcript: 'start feed',
        })
      );

      unsubscribe();
    });

    it('should remove callbacks when unsubscribed', () => {
      const callback = vi.fn();
      const unsubscribe = service.onCommand(callback);

      unsubscribe();

      service.start();
      mockRecognition.simulateResult('start feed');

      expect(callback).not.toHaveBeenCalled();
    });
  });
});
