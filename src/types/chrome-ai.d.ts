declare global {
  type LanguageModelAvailability = 'unavailable' | 'available' | 'downloadable' | 'downloading';

  type LanguageModelRole = 'system' | 'user' | 'assistant';

  type LanguageModelModality = 'text' | 'image' | 'audio';

  interface LanguageModelParams {
    defaultTopK: number;
    maxTopK: number;
    defaultTemperature: number;
    maxTemperature: number;
  }

  interface LanguageModelMessage {
    role: LanguageModelRole;
    content: string;
    prefix?: boolean;
  }

  interface LanguageModelExpectedModality {
    type: LanguageModelModality;
    languages: string[];
  }

  interface LanguageModelPromptOptions {
    signal?: AbortSignal;
    responseConstraint?: unknown;
    omitResponseConstraintInput?: boolean;
  }

  interface LanguageModelCloneOptions {
    signal?: AbortSignal;
  }

  interface LanguageModelCreateOptions {
    topK?: number;
    temperature?: number;
    signal?: AbortSignal;
    initialPrompts?: LanguageModelMessage[];
    expectedInputs?: LanguageModelExpectedModality[];
    expectedOutputs?: LanguageModelExpectedModality[];
    monitor?: (monitor: LanguageModelDownloadMonitor) => void;
  }

  interface LanguageModelAvailabilityOptions {
    expectedInputs?: LanguageModelExpectedModality[];
    expectedOutputs?: LanguageModelExpectedModality[];
  }

  interface LanguageModelDownloadProgressEvent extends Event {
    loaded: number;
  }

  interface LanguageModelDownloadMonitor extends EventTarget {
    addEventListener(
      type: 'downloadprogress',
      listener: (event: LanguageModelDownloadProgressEvent) => void,
      options?: boolean | AddEventListenerOptions
    ): void;
  }

  interface LanguageModelSession {
    prompt: (
      input: string | LanguageModelMessage[],
      options?: LanguageModelPromptOptions
    ) => Promise<string>;
    promptStreaming?: (
      input: string | LanguageModelMessage[],
      options?: LanguageModelPromptOptions
    ) => AsyncIterable<string>;
    append?: (messages: LanguageModelMessage[]) => Promise<void>;
    clone?: (options?: LanguageModelCloneOptions) => Promise<LanguageModelSession>;
    destroy?: () => void;
    inputUsage?: number;
    inputQuota?: number;
  }

  interface LanguageModelInterface {
    availability: (
      options?: LanguageModelAvailabilityOptions
    ) => Promise<LanguageModelAvailability>;
    create: (options?: LanguageModelCreateOptions) => Promise<LanguageModelSession>;
    params: () => Promise<LanguageModelParams>;
  }

  const LanguageModel: LanguageModelInterface | undefined;
}

export {};
