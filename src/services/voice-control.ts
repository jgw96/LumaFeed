/**
 * Voice control service using Web Speech API for continuous speech recognition.
 * Supports commands like "start feeding" and "end feeding" for hands-free operation.
 *
 * Architecture:
 * - Uses browser's native SpeechRecognition API
 * - Auto-restarts when recognition stops to maintain continuous listening
 * - Pattern matches transcriptions for feeding commands
 * - Dispatches CustomEvents for command routing
 *
 * Usage:
 *   const controller = await initVoiceControl();
 *   // Listen for 'voice-command' events on window
 *   controller.stop(); // Clean up when done
 */

export interface VoiceCommand {
  command: 'start-feeding' | 'end-feeding' | 'unknown';
  transcript: string;
  confidence?: number;
}

export interface VoiceControlController {
  stop: () => void;
  isListening: boolean;
}

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
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
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

// Module-level state
let recognition: SpeechRecognition | null = null;
let shouldKeepListening = false;
let restartTimeout: number | null = null;

// Command patterns
const COMMAND_PATTERNS: Record<string, RegExp[]> = {
  'start-feeding': [
    /start\s+(a\s+)?feed(ing)?/i,
    /begin\s+(a\s+)?feed(ing)?/i,
    /start\s+(the\s+)?timer/i,
  ],
  'end-feeding': [
    /end\s+(the\s+)?feed(ing)?/i,
    /stop\s+(the\s+)?feed(ing)?/i,
    /finish\s+(the\s+)?feed(ing)?/i,
    /done\s+(with\s+)?feed(ing)?/i,
    /stop\s+(the\s+)?timer/i,
  ],
};

/**
 * Check if Web Speech API is supported.
 */
function isSpeechRecognitionSupported(): boolean {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

/**
 * Match transcribed text against command patterns.
 */
function matchCommand(transcript: string, confidence: number): VoiceCommand {
  const normalized = transcript.toLowerCase().trim();

  for (const [commandName, patterns] of Object.entries(COMMAND_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(normalized)) {
        return {
          command: commandName as VoiceCommand['command'],
          transcript,
          confidence,
        };
      }
    }
  }

  return {
    command: 'unknown',
    transcript,
    confidence,
  };
}

/**
 * Start the speech recognition.
 */
function startRecognition(): void {
  if (!recognition || !shouldKeepListening) {
    return;
  }

  try {
    recognition.start();
    console.log('[voice-control] Recognition started');
  } catch (error) {
    // Recognition might already be started, ignore error
    console.debug('[voice-control] Recognition start error (may be already running):', error);
  }
}

/**
 * Initialize speech recognition instance.
 */
function initRecognition(): SpeechRecognition {
  const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognitionClass) {
    throw new Error('Speech Recognition API not supported in this browser');
  }

  const recognitionInstance = new SpeechRecognitionClass();

  // Configure recognition
  recognitionInstance.continuous = true; // Keep listening
  recognitionInstance.interimResults = false; // Only get final results
  recognitionInstance.lang = 'en-US';
  recognitionInstance.maxAlternatives = 1;

  // Handle results
  recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
    const last = event.results.length - 1;
    const result = event.results[last];

    if (result.isFinal) {
      const alternative = result[0];
      const transcript = alternative.transcript;
      const confidence = alternative.confidence;

      console.log('[voice-control] Heard:', transcript, `(${Math.round(confidence * 100)}%)`);

      // Match command
      const voiceCommand = matchCommand(transcript, confidence);

      if (voiceCommand.command !== 'unknown') {
        console.log('[voice-control] Command detected:', voiceCommand.command);

        // Dispatch event for app to handle
        window.dispatchEvent(
          new CustomEvent<VoiceCommand>('voice-command', {
            detail: voiceCommand,
            bubbles: true,
            composed: true,
          })
        );
      }
    }
  };

  // Handle errors
  recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
    console.error('[voice-control] Recognition error:', event.error);

    // Don't restart on abort (intentional stop)
    if (event.error === 'aborted') {
      return;
    }

    // Restart on other errors after a brief delay
    if (shouldKeepListening) {
      console.log('[voice-control] Restarting after error...');
      restartTimeout = window.setTimeout(() => {
        startRecognition();
      }, 1000);
    }
  };

  // Handle end event (auto-restart to maintain continuous listening)
  recognitionInstance.onend = () => {
    console.log('[voice-control] Recognition ended');

    if (shouldKeepListening) {
      console.log('[voice-control] Auto-restarting...');
      // Restart immediately
      restartTimeout = window.setTimeout(() => {
        startRecognition();
      }, 100);
    }
  };

  recognitionInstance.onstart = () => {
    console.log('[voice-control] Recognition active');
  };

  return recognitionInstance;
}

/**
 * Stop speech recognition and clean up.
 */
function stopRecognition(): void {
  shouldKeepListening = false;

  if (restartTimeout !== null) {
    clearTimeout(restartTimeout);
    restartTimeout = null;
  }

  if (recognition) {
    try {
      recognition.stop();
    } catch (error) {
      console.debug('[voice-control] Stop error (may already be stopped):', error);
    }
    recognition = null;
  }

  console.log('[voice-control] Voice control stopped');
}

/**
 * Initialize voice control system.
 * Returns a controller object to manage the session.
 *
 * @throws {Error} If Speech Recognition API is not supported
 */
export async function initVoiceControl(): Promise<VoiceControlController> {
  console.log('[voice-control] Initializing voice control...');

  if (!isSpeechRecognitionSupported()) {
    throw new Error(
      'Speech Recognition is not supported in this browser. Try Chrome, Edge, or Safari.'
    );
  }

  // Clean up any existing instance
  if (recognition) {
    stopRecognition();
  }

  // Initialize recognition
  recognition = initRecognition();
  shouldKeepListening = true;

  // Start listening
  startRecognition();

  // Return controller
  return {
    stop: () => {
      stopRecognition();
    },
    isListening: true,
  };
}
