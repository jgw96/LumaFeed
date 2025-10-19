declare module '@mlc-ai/web-llm' {
  export interface WebLlmInitProgress {
    progress?: number;
    text?: string;
  }

  export interface WebLlmChatCompletionMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }

  export interface WebLlmChatCompletionChoice {
    message?: { content?: string };
  }

  export interface WebLlmChatCompletionResult {
    choices?: WebLlmChatCompletionChoice[];
  }

  export interface WebLlmChatCompletions {
    create(request: {
      messages: WebLlmChatCompletionMessage[];
      max_tokens?: number;
      temperature?: number;
    }): Promise<WebLlmChatCompletionResult>;
  }

  export interface WebLlmChat {
    completions: WebLlmChatCompletions;
  }

  export interface MLCEngineInterface {
    chat: WebLlmChat;
  }

  export interface CreateMLCEngineConfig {
    initProgressCallback?: (progress: WebLlmInitProgress) => void;
  }

  export function CreateMLCEngine(
    modelId: string,
    config?: CreateMLCEngineConfig
  ): Promise<MLCEngineInterface>;
}
