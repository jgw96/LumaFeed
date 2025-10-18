import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { FeedingLog } from '../types/feeding-log.js';

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const AI_DOWNLOAD_MESSAGE =
  'Chrome will download the summary helper after you tap Generate. Keep this tab open until it finishes.';
const WEBLLM_PRELOAD_MESSAGE =
  'Runs on this device after a quick one-time download. Tap Generate to get started.';

const AI_EXPECTED_MODALITIES = {
  expectedInputs: [{ type: 'text', languages: ['en'] }],
  expectedOutputs: [{ type: 'text', languages: ['en'] }],
} satisfies Pick<LanguageModelCreateOptions, 'expectedInputs' | 'expectedOutputs'>;

@customElement('feeding-ai-summary-card')
export class FeedingAiSummaryCard extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    section {
      display: grid;
      gap: 1rem;
    }

    .section-title {
      color: var(--md-sys-color-on-surface);
      font-size: var(--md-sys-typescale-title-large-font-size);
      font-weight: var(--md-sys-typescale-title-large-font-weight);
      line-height: var(--md-sys-typescale-title-large-line-height);
      margin: 0;
    }

    .section-body {
      display: grid;
      gap: 0.5rem;
    }

    .section-description {
      margin: 0;
      color: var(--md-sys-color-on-surface-variant);
      font-size: var(--md-sys-typescale-body-medium-font-size);
      line-height: var(--md-sys-typescale-body-medium-line-height);
    }

    button {
      justify-self: start;
      background: var(--md-sys-color-secondary-container);
      color: var(--md-sys-color-on-secondary-container);
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: var(--md-sys-shape-corner-large);
      font-size: var(--md-sys-typescale-label-large-font-size);
      font-weight: var(--md-sys-typescale-label-large-font-weight);
      cursor: pointer;
      transition:
        background-color 0.2s ease,
        transform 0.2s ease;
    }

    button:hover:not(:disabled) {
      background: var(--md-sys-color-secondary);
      color: var(--md-sys-color-on-secondary);
      transform: translateY(-1px);
    }

    button:disabled {
      cursor: not-allowed;
      opacity: 0.6;
      transform: none;
    }

    .status {
      margin: 0;
      color: var(--md-sys-color-on-surface-variant);
      font-size: var(--md-sys-typescale-body-small-font-size);
    }

    .error {
      margin: 0;
      color: var(--md-sys-color-error);
      font-size: var(--md-sys-typescale-body-small-font-size);
    }

    article {
      background: var(--md-sys-color-surface-container-highest);
      border-radius: var(--md-sys-shape-corner-large);
      border: 1px solid var(--md-sys-color-outline-variant);
      padding: 1.25rem;
      display: grid;
      gap: 0.75rem;
      box-shadow: var(--md-sys-elevation-1);
    }

    .summary-text {
      margin: 0;
      color: var(--md-sys-color-on-surface);
      font-size: var(--md-sys-typescale-body-large-font-size);
      line-height: var(--md-sys-typescale-body-large-line-height);
    }

    .disclaimer {
      margin: 0;
      color: var(--md-sys-color-on-surface-variant);
      font-size: var(--md-sys-typescale-body-small-font-size);
    }
  `;

  @property({ attribute: false })
  logs: FeedingLog[] = [];

  @property({ type: Boolean })
  loading: boolean = false;

  @state()
  private summary: string | null = null;

  @state()
  private error: string | null = null;

  @state()
  private supported: boolean = false;

  @state()
  private availabilityMessage: string | null = null;

  @state()
  private busy: boolean = false;

  @state()
  private availabilityState: LanguageModelAvailability | null = null;

  @state()
  private aiMode: 'prompt-api' | 'web-llm' | 'unsupported' = 'unsupported';

  @state()
  private webLlmInitializing: boolean = false;

  private session: LanguageModelSession | null = null;
  private lastSummaryLogIds: string[] = [];
  private summaryHelpersModule: typeof import('../utils/feeding-ai-summary-utils.js') | null = null;
  private summaryHelpersPromise:
    | Promise<typeof import('../utils/feeding-ai-summary-utils.js')>
    | null = null;
  private webLlmModule: typeof import('../utils/feeding-ai-web-llm.js') | null = null;
  private webLlmModulePromise:
    | Promise<typeof import('../utils/feeding-ai-web-llm.js')>
    | null = null;

  connectedCallback() {
    super.connectedCallback();
    void this.checkPromptAvailability();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.session?.destroy) {
      this.session.destroy();
    }
    this.session = null;
  }

  updated(changedProperties: Map<string, unknown>): void {
    if (changedProperties.has('logs')) {
      const previousIds = this.lastSummaryLogIds.join(',');
      const nextIds = this.getLast24HourLogs()
        .map((log) => log.id)
        .join(',');
      if (previousIds !== nextIds) {
        this.summary = null;
        this.lastSummaryLogIds = [];
      }
    }
  }

  render() {
    const recentLogs = this.getLast24HourLogs();
    const usingWebLlm = this.aiMode === 'web-llm';
    const modelPreparing = usingWebLlm
      ? this.webLlmInitializing
      : this.availabilityState === 'downloading' && !this.session;
    const canSummarize = recentLogs.length > 0 && this.supported && !this.loading;
    const disabled = this.busy || !canSummarize || modelPreparing;

    return html`
      <section aria-labelledby="ai-summary-title">
        <div class="section-body">
          <h2 id="ai-summary-title" class="section-title">AI Summary</h2>
          <p class="section-description">
            Get a quick recap of the past day. Your info stays on this device.
          </p>
        </div>
        <button @click=${this.handleGenerateClick} ?disabled=${disabled}>
          ${this.busy ? 'Generating...' : 'Generate summary'}
        </button>
        ${!this.supported
          ? html`<p class="status">
              ${this.availabilityMessage ??
              'Update Chrome on a supported device to use AI summaries.'}
            </p>`
          : nothing}
        ${this.supported && this.availabilityMessage
          ? html`<p class="status">${this.availabilityMessage}</p>`
          : nothing}
        ${this.supported && recentLogs.length === 0
          ? html`<p class="status">Log a feeding in the last 24 hours to unlock this summary.</p>`
          : nothing}
        ${this.error ? html`<p class="error" role="alert">${this.error}</p>` : nothing}
        ${this.summary
          ? html`
              <article aria-live="polite">
                <p class="summary-text">${this.summary}</p>
                <p class="disclaimer">
                  AI insight only - always follow guidance from your care team.
                </p>
              </article>
            `
          : nothing}
      </section>
    `;
  }

  private getLast24HourLogs(): FeedingLog[] {
    const cutoff = Date.now() - DAY_IN_MS;
    return this.logs.filter((log) => typeof log.startTime === 'number' && log.startTime >= cutoff);
  }

  private async getSummaryHelpers() {
    if (this.summaryHelpersModule) {
      return this.summaryHelpersModule;
    }

    if (!this.summaryHelpersPromise) {
      this.summaryHelpersPromise = import('../utils/feeding-ai-summary-utils.js');
    }

    try {
      this.summaryHelpersModule = await this.summaryHelpersPromise;
      return this.summaryHelpersModule;
    } finally {
      this.summaryHelpersPromise = null;
    }
  }

  private applyAvailabilityState(state: LanguageModelAvailability) {
    this.availabilityState = state;
    if (state !== 'unavailable') {
      this.aiMode = 'prompt-api';
    }

    if (state === 'unavailable') {
      this.supported = false;
  this.availabilityMessage = "AI summaries aren't available on this device yet.";
      this.session = null;
      return;
    }

    this.supported = true;

    if (state === 'downloadable') {
      this.session = null;
      this.availabilityMessage = AI_DOWNLOAD_MESSAGE;
      return;
    }

    if (state === 'downloading') {
      if (
        !this.availabilityMessage ||
        !this.availabilityMessage.toLowerCase().startsWith('downloading')
      ) {
  this.availabilityMessage = 'Downloading the summary helper...';
      }
      return;
    }

    this.availabilityMessage = null;
  }

  private updateDownloadProgress(value: number) {
    const clamped = Math.max(0, Math.min(1, value));
    this.availabilityState = 'downloading';
  this.availabilityMessage = `Downloading summary helper: ${Math.round(clamped * 100)}%`;
  }

  private updateWebLlmProgress(progress: { progress?: number | null; text?: string | null }) {
    if (typeof progress?.progress === 'number' && Number.isFinite(progress.progress)) {
  this.availabilityMessage = `Setting up the local summary: ${Math.round(progress.progress * 100)}%`;
      return;
    }

    if (progress?.text) {
      this.availabilityMessage = progress.text;
      return;
    }

  this.availabilityMessage = 'Getting things ready...';
  }

  private async getWebLlmModule() {
    if (this.webLlmModule) {
      return this.webLlmModule;
    }

    if (!this.webLlmModulePromise) {
      this.webLlmModulePromise = import('../utils/feeding-ai-web-llm.js');
    }

    try {
      this.webLlmModule = await this.webLlmModulePromise;
      return this.webLlmModule;
    } finally {
      this.webLlmModulePromise = null;
    }
  }

  private async ensureWebLlmReady(): Promise<void> {
    const module = await this.getWebLlmModule();

    this.webLlmInitializing = true;
    if (!this.availabilityMessage || this.availabilityMessage === WEBLLM_PRELOAD_MESSAGE) {
      this.availabilityMessage = 'Getting the local summary ready...';
    }

    try {
      await module.ensureWebLlmEngine({
        onProgress: (progress) => this.updateWebLlmProgress(progress),
        onStatus: (message) => {
          this.supported = true;
          this.availabilityMessage = message;
        },
      });
    } catch (error) {
      console.warn('WebLLM initialization failed', error);
      this.supported = false;
      this.aiMode = 'unsupported';
      this.availabilityMessage =
        error instanceof Error
          ? `Local summary unavailable right now: ${error.message}`
          : 'Local summary unavailable right now.';
      throw error;
    } finally {
      this.webLlmInitializing = false;
    }
  }

  private async prepareWebLlmSupport(eagerLoad: boolean = false): Promise<void> {
    this.aiMode = 'web-llm';
    this.availabilityState = null;
    this.session = null;

    if (!this.webLlmInitializing && !this.availabilityMessage) {
      this.availabilityMessage = WEBLLM_PRELOAD_MESSAGE;
    }

    this.supported = true;

    if (eagerLoad) {
      try {
  await this.ensureWebLlmReady();
      } catch (error) {
        console.warn('WebLLM eager load failed', error);
      }
    }
  }

  private async ensureSession(): Promise<LanguageModelSession> {
    if (this.session) {
      return this.session;
    }

    if (typeof LanguageModel === 'undefined') {
      throw new Error("Chrome's built-in AI isn't available yet.");
    }

    const { AI_SYSTEM_CONTEXT } = await this.getSummaryHelpers();
    const initialPrompts: LanguageModelMessage[] = [{ role: 'system', content: AI_SYSTEM_CONTEXT }];

    const options: LanguageModelCreateOptions = {
      initialPrompts,
      expectedInputs: AI_EXPECTED_MODALITIES.expectedInputs,
      expectedOutputs: AI_EXPECTED_MODALITIES.expectedOutputs,
      monitor: (monitor: LanguageModelDownloadMonitor) => {
        const handleProgress = (event: LanguageModelDownloadProgressEvent) => {
          const loaded = Number.isFinite(event.loaded) ? event.loaded : 0;
          this.updateDownloadProgress(loaded);
        };
        monitor.addEventListener('downloadprogress', handleProgress);
      },
    };

    if (this.availabilityState !== 'available') {
      this.applyAvailabilityState('downloading');
    }

    const session = await LanguageModel.create(options);
    this.session = session;
    this.applyAvailabilityState('available');
    return session;
  }

  private async generateWithPromptApi(logs: FeedingLog[]): Promise<string> {
    const session = await this.ensureSession();
    const { buildAiSummaryPrompt } = await this.getSummaryHelpers();
    const prompt = buildAiSummaryPrompt(logs);
    return session.prompt([{ role: 'user', content: prompt }]);
  }

  private async generateWithWebLlm(logs: FeedingLog[]): Promise<string> {
    const module = await this.getWebLlmModule();
    const { buildAiSummaryPrompt, AI_SYSTEM_CONTEXT } = await this.getSummaryHelpers();

    this.webLlmInitializing = true;
    if (!this.availabilityMessage || this.availabilityMessage === WEBLLM_PRELOAD_MESSAGE) {
      this.availabilityMessage = 'Getting the local summary ready...';
    }

    try {
      const prompt = buildAiSummaryPrompt(logs);
      return await module.generateSummaryWithWebLlm({
        prompt,
        systemContext: AI_SYSTEM_CONTEXT,
        callbacks: {
          onProgress: (progress) => this.updateWebLlmProgress(progress),
          onStatus: (message) => {
            this.supported = true;
            this.availabilityMessage = message;
          },
        },
      });
    } catch (error) {
      console.warn('WebLLM summary generation failed', error);
      this.supported = false;
      this.aiMode = 'unsupported';
      this.availabilityMessage =
        error instanceof Error
          ? `Local summary unavailable right now: ${error.message}`
          : 'Local summary unavailable right now.';
      throw error;
    } finally {
      this.webLlmInitializing = false;
    }
  }

  private async handleGenerateClick() {
    this.error = null;

    if (!this.supported) {
      await this.checkPromptAvailability();
    }

    const logs = this.getLast24HourLogs();
    if (logs.length === 0) {
  this.error = 'Log at least one feeding in the last 24 hours to see a summary.';
      return;
    }

    if (!this.supported) {
  this.error = this.availabilityMessage ?? "AI summaries aren't available on this device yet.";
      return;
    }

    this.busy = true;

    try {
      let response: string;

      if (this.aiMode === 'prompt-api') {
        try {
          response = await this.generateWithPromptApi(logs);
        } catch (error) {
          const promptMissing =
            typeof LanguageModel === 'undefined' ||
            (error instanceof Error && /Prompt API/i.test(error.message));
          if (!promptMissing) {
            throw error;
          }
          await this.prepareWebLlmSupport();
          response = await this.generateWithWebLlm(logs);
        }
      } else if (this.aiMode === 'web-llm') {
        response = await this.generateWithWebLlm(logs);
      } else {
        await this.prepareWebLlmSupport();
        response = await this.generateWithWebLlm(logs);
      }

      const { enforceAiSummaryLength } = await this.getSummaryHelpers();
      this.summary = enforceAiSummaryLength(response.trim());
      this.lastSummaryLogIds = logs.map((log) => log.id);
    } catch (error) {
      console.error('AI summary generation failed', error);
      this.summary = null;
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        this.error =
          'Chrome needs you to interact with the page first. Tap anywhere, then try Generate again.';
      } else if (error instanceof Error) {
        this.error = error.message;
      } else {
        this.error = 'Unable to generate summary right now.';
      }
      if (this.aiMode === 'prompt-api' && typeof LanguageModel === 'undefined') {
        await this.prepareWebLlmSupport();
      }
    } finally {
      this.busy = false;
      if (this.aiMode === 'prompt-api') {
        void this.checkPromptAvailability();
      }
    }
  }

  private async checkPromptAvailability(): Promise<void> {
    if (typeof LanguageModel === 'undefined') {
      await this.prepareWebLlmSupport();
      return;
    }

    try {
      const availability = await LanguageModel.availability(AI_EXPECTED_MODALITIES);
      if (!this.isConnected) {
        return;
      }

      if (availability === 'unavailable') {
        await this.prepareWebLlmSupport();
        return;
      }

      this.applyAvailabilityState(availability);
    } catch (error) {
      console.warn('AI availability check failed', error);
      await this.prepareWebLlmSupport();
      if (this.aiMode !== 'web-llm') {
  this.supported = false;
  this.availabilityState = null;
  this.availabilityMessage = "We couldn't check if summaries are available right now.";
      }
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'feeding-ai-summary-card': FeedingAiSummaryCard;
  }
}
