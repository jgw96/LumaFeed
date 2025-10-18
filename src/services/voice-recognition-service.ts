/**
 * Voice recognition service for hands-free feeding control.
 * Uses the Web Speech API (SpeechRecognition) which works on mobile devices.
 */

// Define types for the Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((event: Event) => void) | null;
  onstart: ((event: Event) => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export type VoiceCommand = 'start-feed' | 'end-feed' | 'unknown';

export interface VoiceRecognitionResult {
  command: VoiceCommand;
  transcript: string;
  confidence: number;
}

export type VoiceRecognitionCallback = (result: VoiceRecognitionResult) => void;

export class VoiceRecognitionService {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  private callbacks: VoiceRecognitionCallback[] = [];

  /**
   * Check if speech recognition is supported in the current browser
   */
  public static isSupported(): boolean {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  /**
   * Initialize the speech recognition service
   */
  constructor() {
    if (!VoiceRecognitionService.isSupported()) {
      console.warn('[voice-recognition-service] Speech recognition not supported in this browser');
      return;
    }

    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      return;
    }

    this.recognition = new SpeechRecognitionAPI();
    this.recognition.continuous = true;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      this.handleResult(event);
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('[voice-recognition-service] Recognition error:', event.error);
      // Auto-restart on network errors or no-speech errors if we were listening
      if (this.isListening && (event.error === 'network' || event.error === 'no-speech')) {
        setTimeout(() => {
          if (this.isListening) {
            this.start();
          }
        }, 1000);
      }
    };

    this.recognition.onend = () => {
      // Auto-restart if we were listening and it stopped unexpectedly
      if (this.isListening) {
        setTimeout(() => {
          if (this.isListening) {
            this.start();
          }
        }, 100);
      }
    };
  }

  /**
   * Parse the transcript and determine which command was spoken
   */
  private parseCommand(transcript: string): VoiceCommand {
    const normalized = transcript.toLowerCase().trim();

    // Start feed commands
    if (
      normalized.includes('start feed') ||
      normalized.includes('start feeding') ||
      normalized.includes('begin feed') ||
      normalized.includes('begin feeding')
    ) {
      return 'start-feed';
    }

    // End feed commands
    if (
      normalized.includes('end feed') ||
      normalized.includes('end feeding') ||
      normalized.includes('finish feed') ||
      normalized.includes('finish feeding') ||
      normalized.includes('stop feed') ||
      normalized.includes('stop feeding') ||
      normalized.includes('done feeding')
    ) {
      return 'end-feed';
    }

    return 'unknown';
  }

  /**
   * Handle recognition results
   */
  private handleResult(event: SpeechRecognitionEvent): void {
    const results = event.results;
    const lastResultIndex = results.length - 1;
    const result = results[lastResultIndex];

    if (!result.isFinal) {
      return;
    }

    const alternative = result[0];
    const transcript = alternative.transcript;
    const confidence = alternative.confidence;

    const command = this.parseCommand(transcript);

    console.debug('[voice-recognition-service] Recognized:', {
      transcript,
      command,
      confidence,
    });

    // Only process known commands
    if (command !== 'unknown') {
      const recognitionResult: VoiceRecognitionResult = {
        command,
        transcript,
        confidence,
      };

      // Notify all callbacks
      this.callbacks.forEach((callback) => {
        try {
          callback(recognitionResult);
        } catch (error) {
          console.error('[voice-recognition-service] Callback error:', error);
        }
      });
    }
  }

  /**
   * Start listening for voice commands
   */
  public start(): void {
    if (!this.recognition) {
      console.warn('[voice-recognition-service] Recognition not initialized');
      return;
    }

    if (this.isListening) {
      return;
    }

    try {
      this.recognition.start();
      this.isListening = true;
      console.debug('[voice-recognition-service] Started listening');
    } catch (error) {
      console.error('[voice-recognition-service] Failed to start:', error);
    }
  }

  /**
   * Stop listening for voice commands
   */
  public stop(): void {
    if (!this.recognition || !this.isListening) {
      return;
    }

    try {
      this.recognition.stop();
      this.isListening = false;
      console.debug('[voice-recognition-service] Stopped listening');
    } catch (error) {
      console.error('[voice-recognition-service] Failed to stop:', error);
    }
  }

  /**
   * Check if currently listening
   */
  public getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Register a callback to be notified of voice commands
   */
  public onCommand(callback: VoiceRecognitionCallback): () => void {
    this.callbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.stop();
    this.callbacks = [];
    if (this.recognition) {
      this.recognition.onresult = null;
      this.recognition.onerror = null;
      this.recognition.onend = null;
      this.recognition.onstart = null;
    }
  }
}

// Export singleton instance
export const voiceRecognitionService = new VoiceRecognitionService();
