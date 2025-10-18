import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { FeedingLog } from '../types/feeding-log.js';

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const AI_SUMMARY_SYSTEM_PROMPT = `You are an encouraging infant-feeding assistant. Summarize the caregiver's last 24 hours of bottle feeds in UNDER 70 WORDS spread across no more than two sentences. Highlight positives, mention any gentle watch-outs, and remind them to consult a pediatrician for medical decisions.`;
const AI_FEEDING_GUIDELINES = `General reference ranges (bottle feeding): 0-1 month: 60-90 ml (2-3 oz) every 3-4 hours; 1-2 months: 90-120 ml (3-4 oz) every 3-4 hours; 2-4 months: 120-150 ml (4-5 oz) every 3-4 hours. Babies vary - use the data as a guide, not a diagnosis.`;
const AI_DOWNLOAD_MESSAGE =
  'Chrome will download the on-device model after you press Generate. Keep this tab open until it finishes.';
const AI_SYSTEM_CONTEXT = `${AI_SUMMARY_SYSTEM_PROMPT}\n\nReference guidance:\n${AI_FEEDING_GUIDELINES}`;

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

  private session: LanguageModelSession | null = null;
  private lastSummaryLogIds: string[] = [];

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
    const canSummarize = recentLogs.length > 0 && this.supported && !this.loading;
    const downloadInProgress = this.availabilityState === 'downloading' && !this.session;
    const disabled = this.busy || !canSummarize || downloadInProgress;

    return html`
      <section aria-labelledby="ai-summary-title">
        <div class="section-body">
          <h2 id="ai-summary-title" class="section-title">AI Summary</h2>
          <p class="section-description">
            Get a quick, on-device recap of the last day. Chrome keeps this data local.
          </p>
        </div>
        <button @click=${this.handleGenerateClick} ?disabled=${disabled}>
          ${this.busy ? 'Generating...' : 'Generate summary'}
        </button>
        ${!this.supported
          ? html`<p class="status">
              ${this.availabilityMessage ??
              'Update to the latest Chrome on an eligible device to use AI summaries.'}
            </p>`
          : nothing}
        ${this.supported && this.availabilityMessage
          ? html`<p class="status">${this.availabilityMessage}</p>`
          : nothing}
        ${this.supported && recentLogs.length === 0
          ? html`<p class="status">Add a feeding in the last 24 hours to unlock this summary.</p>`
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

  private computeStats(logs: FeedingLog[]) {
    const totalMl = logs.reduce((sum, log) => sum + (log.amountMl ?? 0), 0);
    const totalOz = logs.reduce((sum, log) => sum + (log.amountOz ?? 0), 0);
    const totalDuration = logs.reduce((sum, log) => sum + (log.durationMinutes ?? 0), 0);
    const sorted = [...logs].sort((a, b) => a.startTime - b.startTime);

    let accumulatedIntervals = 0;
    for (let i = 1; i < sorted.length; i += 1) {
      accumulatedIntervals += sorted[i].startTime - sorted[i - 1].startTime;
    }

    const averageIntervalMinutes =
      sorted.length > 1 ? accumulatedIntervals / (sorted.length - 1) / 60_000 : null;

    return {
      feedCount: logs.length,
      totalMl,
      totalOz,
      averageMl: logs.length ? totalMl / logs.length : 0,
      averageOz: logs.length ? totalOz / logs.length : 0,
      averageDuration: logs.length ? totalDuration / logs.length : 0,
      averageIntervalMinutes,
      bottleFeeds: logs.filter((log) => log.isBottleFed).length,
      nursingFeeds: logs.filter((log) => !log.isBottleFed).length,
    };
  }

  private formatNumber(value: number, decimals: number = 1): string {
    if (!Number.isFinite(value)) {
      return '0';
    }

    const formatter = new Intl.NumberFormat(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return formatter.format(value);
  }

  private formatMinutes(value: number | null): string {
    if (!Number.isFinite(value) || value === null) {
      return 'N/A';
    }

    const rounded = Math.round(value);
    const hours = Math.floor(rounded / 60);
    const minutes = rounded % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }

    return `${minutes}m`;
  }

  private formatClock(timestamp: number): string {
    const formatter = new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });

    return formatter.format(new Date(timestamp));
  }

  private enforceSummaryLength(text: string, maxWords: number = 70): string {
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (words.length <= maxWords) {
      return text.trim();
    }

    const shortened = words.slice(0, maxWords).join(' ');
    return `${shortened}…`;
  }

  private buildPrompt(logs: FeedingLog[]): string {
    const stats = this.computeStats(logs);
    const details = logs
      .slice()
      .sort((a, b) => a.startTime - b.startTime)
      .map((log) => {
        const amountMl = this.formatNumber(log.amountMl ?? 0, 0);
        const amountOz = this.formatNumber(log.amountOz ?? 0, 1);
        const duration = this.formatMinutes(log.durationMinutes ?? null);
        const label = log.feedType === 'formula' ? 'Formula bottle' : 'Breast milk';
        const timing = this.formatClock(log.startTime);
        return `- ${timing}: ${label}, ${amountMl} ml (${amountOz} oz), duration ${duration}`;
      })
      .join('\n');

    const averageInterval = this.formatMinutes(stats.averageIntervalMinutes);
    const averageDuration = this.formatMinutes(stats.averageDuration);

    return [
      'You are helping a caregiver review feeding logs for the last 24 hours.',
      `Reference guidance: ${AI_FEEDING_GUIDELINES}`,
      `Summary statistics:\n- Total feeds: ${stats.feedCount}\n- Bottle feeds: ${stats.bottleFeeds}\n- Nursing sessions: ${stats.nursingFeeds}\n- Total intake: ${this.formatNumber(stats.totalMl, 0)} ml (${this.formatNumber(stats.totalOz, 1)} oz)\n- Average intake per feed: ${this.formatNumber(stats.averageMl, 0)} ml (${this.formatNumber(stats.averageOz, 1)} oz)\n- Average duration: ${averageDuration}\n- Average interval: ${averageInterval}`,
      `Detailed entries:\n${details}`,
      'Create a short, upbeat summary mentioning positive trends and any gentle watch-outs. End with a reminder that caregivers should consult healthcare professionals for specific advice.',
    ].join('\n\n');
  }

  private applyAvailabilityState(state: LanguageModelAvailability) {
    this.availabilityState = state;

    if (state === 'unavailable') {
      this.supported = false;
      this.availabilityMessage = 'AI summaries are not supported on this device yet.';
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
        this.availabilityMessage = 'Downloading the on-device model...';
      }
      return;
    }

    this.availabilityMessage = null;
  }

  private updateDownloadProgress(value: number) {
    const clamped = Math.max(0, Math.min(1, value));
    this.availabilityState = 'downloading';
    this.availabilityMessage = `Downloading on-device model: ${Math.round(clamped * 100)}%`;
  }

  private async ensureSession(): Promise<LanguageModelSession> {
    if (this.session) {
      return this.session;
    }

    if (typeof LanguageModel === 'undefined') {
      throw new Error('Chrome built-in Prompt API is not available yet.');
    }

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

  private async handleGenerateClick() {
    this.error = null;

    if (!this.supported) {
      await this.checkPromptAvailability();
    }

    const logs = this.getLast24HourLogs();
    if (logs.length === 0) {
      this.error = 'Add at least one feeding in the last 24 hours to generate a summary.';
      return;
    }

    if (!this.supported) {
      this.error = this.availabilityMessage ?? 'AI summaries are not supported on this device yet.';
      return;
    }

    if (typeof LanguageModel === 'undefined') {
      this.error = 'Chrome built-in Prompt API is not available yet.';
      return;
    }

    this.busy = true;

    try {
      const session = await this.ensureSession();
      const prompt = this.buildPrompt(logs);
      const response = await session.prompt([{ role: 'user', content: prompt }]);
      this.summary = this.enforceSummaryLength(response.trim());
      this.lastSummaryLogIds = logs.map((log) => log.id);
    } catch (error) {
      console.error('AI summary generation failed', error);
      this.summary = null;
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        this.error =
          'Chrome needs a user gesture to use the on-device model. Please click Generate again after interacting with the page.';
      } else if (error instanceof Error) {
        this.error = error.message;
      } else {
        this.error = 'Unable to generate summary right now.';
      }
    } finally {
      this.busy = false;
      void this.checkPromptAvailability();
    }
  }

  private async checkPromptAvailability(): Promise<void> {
    if (typeof LanguageModel === 'undefined') {
      this.supported = false;
      this.availabilityState = null;
      this.availabilityMessage =
        'Update to the latest Chrome on an eligible device to use AI summaries.';
      return;
    }

    try {
      const availability = await LanguageModel.availability(AI_EXPECTED_MODALITIES);
      if (!this.isConnected) {
        return;
      }

      this.applyAvailabilityState(availability);
    } catch (error) {
      console.warn('AI availability check failed', error);
      this.supported = false;
      this.availabilityState = null;
      this.availabilityMessage = 'Could not verify AI support.';
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'feeding-ai-summary-card': FeedingAiSummaryCard;
  }
}
