import type {
  MLCEngineInterface as WebLlmEngine,
  WebLlmChatCompletionMessage,
  WebLlmInitProgress,
} from '@mlc-ai/web-llm';

const WEBLLM_MODEL_ID = 'SmolLM2-360M-Instruct-q4f16_1-MLC';

let cachedEngine: WebLlmEngine | null = null;
let cachedInitPromise: Promise<WebLlmEngine> | null = null;

export interface WebLlmCallbacks {
  onProgress?: (progress: WebLlmInitProgress) => void;
  onStatus?: (message: string) => void;
}

async function loadEngine(callbacks?: WebLlmCallbacks): Promise<WebLlmEngine> {
  const { CreateMLCEngine } = await import('@mlc-ai/web-llm');
  const engine = await CreateMLCEngine(WEBLLM_MODEL_ID, {
    initProgressCallback: (progress) => {
      callbacks?.onProgress?.(progress);
    },
  });
  callbacks?.onStatus?.('Summaries run right on this device.');
  return engine;
}

export async function ensureWebLlmEngine(callbacks?: WebLlmCallbacks): Promise<WebLlmEngine> {
  if (cachedEngine) {
    return cachedEngine;
  }

  if (cachedInitPromise) {
    return cachedInitPromise;
  }

  cachedInitPromise = (async () => {
    try {
      cachedEngine = await loadEngine(callbacks);
      return cachedEngine;
    } finally {
      cachedInitPromise = null;
    }
  })();

  try {
    return await cachedInitPromise;
  } catch (error) {
    cachedEngine = null;
    throw error;
  }
}

interface GenerateSummaryOptions {
  prompt: string;
  systemContext: string;
  callbacks?: WebLlmCallbacks;
  temperature?: number;
  maxTokens?: number;
}

export async function generateSummaryWithWebLlm(
  options: GenerateSummaryOptions,
): Promise<string> {
  const engine = await ensureWebLlmEngine(options.callbacks);
  const messages: WebLlmChatCompletionMessage[] = [
    { role: 'system', content: options.systemContext },
    { role: 'user', content: options.prompt },
  ];

  const result = await engine.chat.completions.create({
    messages,
    max_tokens: options.maxTokens ?? 256,
    temperature: options.temperature ?? 0.6,
  });

  const content = result.choices?.[0]?.message?.content?.trim();
  if (!content) {
  throw new Error('The local summary helper did not return a result.');
  }

  return content;
}

export type { WebLlmInitProgress };
