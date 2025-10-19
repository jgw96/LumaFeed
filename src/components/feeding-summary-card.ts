import { LitElement, html, css, PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { FeedingLog } from '../types/feeding-log.js';
import { formatNextFeedLabel } from '../utils/feed-time.js';
import type { ChartDataPoint } from '../utils/feeding-summary/draw-chart.js';

type FormatNumberFn = (typeof import('../utils/feeding-summary/format-number.js'))['formatNumber'];
type ResolveNextFeedTimeFn =
  (typeof import('../utils/feeding-summary/resolve-next-feed-time.js'))['resolveNextFeedTime'];
type DrawChartFn = (typeof import('../utils/feeding-summary/draw-chart.js'))['drawChart'];
import './feeding-ai-summary-card.js';

@customElement('feeding-summary-card')
export class FeedingSummaryCard extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .summary-card {
      background: var(--md-sys-color-surface-container-low);
      border-radius: var(--md-sys-shape-corner-extra-large);
      border: 1px solid var(--md-sys-color-outline-variant);
      padding: 1.25rem 1.5rem;
      box-shadow: var(--md-sys-elevation-1);
      display: grid;
      gap: 1.75rem;
      margin-bottom: 2rem;
    }

    .summary-card__title {
      font-weight: 600;
      color: var(--md-sys-color-primary);
      font-size: 1rem;
      line-height: 1.5;
    }

    .summary-card__status {
      font-size: var(--md-sys-typescale-body-medium-font-size);
      line-height: var(--md-sys-typescale-body-medium-line-height);
      color: var(--md-sys-color-on-surface-variant);
    }

    .summary-card__totals {
      display: inline-flex;
      align-items: baseline;
      gap: 0.5rem;
      font-size: var(--md-sys-typescale-title-small-font-size);
      font-weight: var(--md-sys-typescale-title-small-font-weight);
      color: var(--md-sys-color-on-surface);
    }

    .summary-card__secondary {
      font-size: var(--md-sys-typescale-body-small-font-size);
      color: var(--md-sys-color-on-surface-variant);
    }

    .summary-card__highlight {
      background: var(--md-sys-color-secondary-container);
      color: var(--md-sys-color-on-secondary-container);
      border-radius: var(--md-sys-shape-corner-large);
      padding: 0.75rem 1rem;
      display: grid;
      gap: 0.25rem;
    }

    .summary-card__highlight-label {
      font-size: var(--md-sys-typescale-body-small-font-size);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      opacity: 0.9;
    }

    .summary-card__highlight-value {
      font-size: var(--md-sys-typescale-title-small-font-size);
      font-weight: var(--md-sys-typescale-title-small-font-weight);
    }

    .summary-card__empty {
      font-size: var(--md-sys-typescale-body-medium-font-size);
      color: var(--md-sys-color-on-surface-variant);
    }

    .summary-card__chart {
      display: block;
      position: relative;
      width: 100%;
      height: 180px;
    }

    .summary-card__chart canvas {
      width: 100%;
      height: 100%;
      display: block;
    }

    .summary-card__section {
      display: grid;
      gap: 0.75rem;
    }

    .summary-card__ai {
      border-top: 1px solid var(--md-sys-color-outline-variant);
      padding-top: 1.5rem;
    }
  `;

  @property({ type: Array })
  logs: FeedingLog[] = [];

  @property({ type: Boolean })
  loading = false;

  @property({ type: Boolean })
  showAiSummary = true;

  private utilitiesReady = false;

  private utilitiesPromise?: Promise<void>;

  private formatNumberFn!: FormatNumberFn;

  private resolveNextFeedTimeFn!: ResolveNextFeedTimeFn;

  private drawChartFn?: DrawChartFn;

  private drawChartPromise?: Promise<DrawChartFn>;

  private readonly handleWindowResize = () => {
    if (!this.loading) {
      this.renderChart();
    }
  };

  protected shouldUpdate(changed: PropertyValues<this>): boolean {
    if (!this.utilitiesReady) {
      if (!this.utilitiesPromise) {
        this.utilitiesPromise = this.loadUtilities();
      }
      return false;
    }

    return super.shouldUpdate(changed);
  }

  protected firstUpdated(): void {
    window.addEventListener('resize', this.handleWindowResize);
    void this.updateComplete.then(() => this.renderChart());
  }

  protected updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    const logsKey: keyof FeedingSummaryCard = 'logs';
    const loadingKey: keyof FeedingSummaryCard = 'loading';

    if ((changed.has(logsKey) || changed.has(loadingKey)) && !this.loading) {
      void this.updateComplete.then(() => this.renderChart());
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener('resize', this.handleWindowResize);
  }

  private calculateSummary(): {
    feedings: number;
    totalMl: number;
    totalOz: number;
    averageIntervalMinutes: number | null;
  } {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    let feedings = 0;
    let totalMl = 0;
    let totalOz = 0;
    const feedTimestamps: number[] = [];

    for (const log of this.logs) {
      const timestamp = typeof log.endTime === 'number' ? log.endTime : log.timestamp;
      if (typeof timestamp === 'number' && timestamp >= cutoff) {
        feedings += 1;
        feedTimestamps.push(timestamp);
        if (Number.isFinite(log.amountMl)) {
          totalMl += log.amountMl as number;
        }
        if (Number.isFinite(log.amountOz)) {
          totalOz += log.amountOz as number;
        }
      }
    }

    let averageIntervalMinutes: number | null = null;
    if (feedTimestamps.length >= 2) {
      // Sort timestamps in ascending order
      feedTimestamps.sort((a, b) => a - b);

      // Calculate intervals between consecutive feeds
      const intervals: number[] = [];
      for (let i = 1; i < feedTimestamps.length; i++) {
        intervals.push(feedTimestamps[i] - feedTimestamps[i - 1]);
      }

      // Calculate average interval in minutes
      const totalInterval = intervals.reduce((sum, interval) => sum + interval, 0);
      averageIntervalMinutes = Math.round(totalInterval / intervals.length / 60_000);
    }

    return { feedings, totalMl, totalOz, averageIntervalMinutes };
  }

  private formatFeedingLabel(count: number): string {
    return count === 1 ? '1 feeding' : `${count} feedings`;
  }

  private formatInterval(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return hours === 1 ? '1 hr' : `${hours} hrs`;
    }
    return `${hours} hr ${remainingMinutes} min`;
  }

  private getChartDescription(): string {
    const data = this.filteredLogs();
    if (!data.length) {
      return 'No feeding data available to graph.';
    }

    const firstEntry = data[data.length - 1];
    const lastEntry = data[0];
    const formatter = new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

    return `Feeding amounts from ${formatter.format(firstEntry.timestamp)} to ${formatter.format(lastEntry.timestamp)}.`;
  }

  private resolveAmountMl(log: FeedingLog): number {
    if (Number.isFinite(log.amountMl)) {
      return log.amountMl as number;
    }

    if (Number.isFinite(log.amountOz)) {
      return (log.amountOz as number) * 29.5735;
    }

    return 0;
  }

  private filteredLogs(): ChartDataPoint[] {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return this.logs
      .filter((log) => {
        const timestamp = typeof log.endTime === 'number' ? log.endTime : log.timestamp;
        return typeof timestamp === 'number' && timestamp >= cutoff;
      })
      .reverse()
      .map((log) => ({
        amount: this.resolveAmountMl(log),
        timestamp: (typeof log.endTime === 'number' ? log.endTime : log.timestamp) as number,
      }))
      .filter((entry) => Number.isFinite(entry.timestamp));
  }

  private async loadUtilities(): Promise<void> {
    try {
      const [{ formatNumber }, { resolveNextFeedTime }] = await Promise.all([
        import('../utils/feeding-summary/format-number.js'),
        import('../utils/feeding-summary/resolve-next-feed-time.js'),
      ]);
      this.formatNumberFn = formatNumber;
      this.resolveNextFeedTimeFn = resolveNextFeedTime;
    } catch (error) {
      console.error('Failed to load feeding summary helpers', error);
      this.formatNumberFn = (value: number, maxFractionDigits = 0) =>
        value.toLocaleString(undefined, { maximumFractionDigits: maxFractionDigits });
      this.resolveNextFeedTimeFn = () => undefined;
    } finally {
      this.utilitiesReady = true;
      this.requestUpdate();
    }
  }

  private loadChartModule(): Promise<DrawChartFn> {
    if (this.drawChartFn) {
      return Promise.resolve(this.drawChartFn);
    }

    if (!this.drawChartPromise) {
      this.drawChartPromise = import('../utils/feeding-summary/draw-chart.js')
        .then((module) => {
          this.drawChartFn = module.drawChart;
          return module.drawChart;
        })
        .finally(() => {
          this.drawChartPromise = undefined;
        });
    }

    return this.drawChartPromise;
  }

  private renderChart(): void {
    if (this.loading) {
      return;
    }

    const canvas = this.renderRoot?.querySelector<HTMLCanvasElement>('#feedChart');
    if (!canvas) {
      return;
    }

    const data = this.filteredLogs();
    if (!data.length) {
      const context = canvas.getContext('2d');
      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    if (this.drawChartFn) {
      this.drawChartFn({ canvas, host: this, data });
      return;
    }

    void this.loadChartModule()
      .then((drawChart) => {
        if (!this.isConnected) {
          return;
        }
        if (!canvas.isConnected) {
          return;
        }
        drawChart({ canvas, host: this, data });
      })
      .catch((error) => {
        console.error('Failed to render feeding chart', error);
      });
  }

  render() {
    const summary = this.calculateSummary();
    const { feedings, totalMl, totalOz, averageIntervalMinutes } = summary;
    const filtered = this.filteredLogs();
    const hasChartData = filtered.length > 0;
    const nextFeedTime = this.resolveNextFeedTimeFn(this.logs);
    const nextFeedLabel =
      typeof nextFeedTime === 'number' ? formatNextFeedLabel(nextFeedTime) : null;

    return html`
      <div class="summary-card" role="status" aria-live="polite">
        <div class="summary-card__section">
          <span class="summary-card__title">Last 24 hours at a glance</span>
          ${this.loading
            ? html`<span class="summary-card__status">Loading your summary…</span>`
            : feedings > 0
              ? html`
                  <span class="summary-card__status">${this.formatFeedingLabel(feedings)}</span>
                  <div class="summary-card__totals">
                    <span>${this.formatNumberFn(totalMl)} ml</span>
                    <span class="summary-card__secondary"
                      >(${this.formatNumberFn(totalOz, 1)} oz)</span
                    >
                  </div>

                  ${hasChartData
                    ? html`
                        <div
                          class="summary-card__chart"
                          role="img"
                          aria-label="${this.getChartDescription()}"
                        >
                          <canvas id="feedChart" aria-hidden="true"></canvas>
                        </div>
                      `
                    : html`<div class="summary-card__empty">
                        No chart data yet for the last 24 hours.
                      </div>`}
                  ${nextFeedLabel
                    ? html`
                        <div
                          class="summary-card__highlight"
                          role="note"
                          aria-label="Next suggested feed"
                        >
                          <span class="summary-card__highlight-label">Next feed</span>
                          <span class="summary-card__highlight-value">${nextFeedLabel}</span>
                        </div>
                      `
                    : null}
                  ${averageIntervalMinutes !== null
                    ? html`
                        <div
                          class="summary-card__highlight"
                          role="note"
                          aria-label="Average interval between feedings in the last 24 hours"
                        >
                          <span class="summary-card__highlight-label">Average interval</span>
                          <span class="summary-card__highlight-value"
                            >${this.formatInterval(averageIntervalMinutes)}</span
                          >
                        </div>
                      `
                    : null}
                `
              : html`
                  <span class="summary-card__status">No feedings logged yet</span>
                  <div class="summary-card__empty">Log a feeding to see your totals.</div>
                `}
        </div>

        ${this.showAiSummary
          ? html`
              <feeding-ai-summary-card
                class="summary-card__ai"
                .logs=${this.logs}
                .loading=${this.loading}
              ></feeding-ai-summary-card>
            `
          : null}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'feeding-summary-card': FeedingSummaryCard;
  }
}
