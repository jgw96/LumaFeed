import { LitElement, html, css, PropertyValues } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import type { DiaperLog, DiaperSummaryStats } from '../types/diaper-log.js';
import { calculateDiaperSummary } from '../utils/diaper-summary/calculate-summary.js';
import { buildDiaperChartData } from '../utils/diaper-summary/build-chart-data.js';
import { drawDiaperChart } from '../utils/diaper-summary/draw-diaper-chart.js';

@customElement('diaper-summary-card')
export class DiaperSummaryCard extends LitElement {
  static styles = css`
    :host {
      display: block;
      --diaper-wet-color: color-mix(in srgb, var(--md-sys-color-primary) 68%, transparent);
      --diaper-both-color: color-mix(in srgb, var(--md-sys-color-secondary) 76%, transparent);
      --diaper-dirty-color: color-mix(in srgb, var(--md-sys-color-tertiary) 82%, transparent);
    }

    .summary-card {
      background: var(--md-sys-color-surface-container-low);
      border-radius: var(--md-sys-shape-corner-extra-large);
      border: 1px solid var(--md-sys-color-outline-variant);
      padding: 1.25rem 1.5rem;
      box-shadow: var(--md-sys-elevation-1);
      display: grid;
      gap: 1.75rem;
    }

    .summary-card__section {
      display: grid;
      gap: 0.75rem;
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
      font-size: var(--md-sys-typescale-label-small-font-size);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      opacity: 0.92;
    }

    .summary-card__highlight-value {
      font-size: var(--md-sys-typescale-title-small-font-size);
      font-weight: var(--md-sys-typescale-title-small-font-weight);
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
    }

    .summary-card__highlight-subtle {
      font-size: var(--md-sys-typescale-body-small-font-size);
      color: color-mix(in srgb, var(--md-sys-color-on-secondary-container) 80%, transparent);
    }

    .summary-card__highlights {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 0.75rem;
    }

    .summary-card__metadata {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
      padding: 0.75rem 1rem;
      border-radius: var(--md-sys-shape-corner-large);
      background: var(--md-sys-color-surface-container-lowest);
      border: 1px solid var(--md-sys-color-outline-variant);
    }

    .summary-card__metadata-item {
      display: grid;
      gap: 0.25rem;
    }

    .summary-card__metadata-label {
      font-size: var(--md-sys-typescale-label-small-font-size);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--md-sys-color-on-surface-variant);
    }

    .summary-card__metadata-value {
      color: var(--md-sys-color-on-surface);
      font-weight: 600;
    }

    .summary-card__chart {
      display: grid;
      gap: 0.75rem;
    }

    .summary-card__chart canvas {
      width: 100%;
      height: 200px;
      display: block;
      border-radius: var(--md-sys-shape-corner-large);
      background: var(--md-sys-color-surface-container);
    }

    .summary-card__legend {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      font-size: var(--md-sys-typescale-label-medium-font-size);
      color: var(--md-sys-color-on-surface-variant);
    }

    .summary-card__legend-item {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .summary-card__legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 999px;
      background: currentColor;
    }

    .summary-card__empty {
      text-align: center;
      color: var(--md-sys-color-on-surface-variant);
      font-size: var(--md-sys-typescale-body-medium-font-size);
      padding: 1rem;
    }

    @media (max-width: 480px) {
      .summary-card__totals {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.25rem;
      }
    }
  `;

  @property({ type: Array })
  logs: DiaperLog[] = [];

  @property({ type: Boolean })
  loading = false;

  @query('canvas')
  private canvas?: HTMLCanvasElement;

  private resizeObserver?: ResizeObserver;

  private readonly numberFormatter = new Intl.NumberFormat();

  protected firstUpdated(): void {
    const resizeObserverCtor = (
      window as typeof window & { ResizeObserver?: typeof ResizeObserver }
    ).ResizeObserver;

    if (typeof resizeObserverCtor === 'function') {
      this.resizeObserver = new resizeObserverCtor(() => this.renderChart());
      if (this.canvas) {
        this.resizeObserver.observe(this.canvas);
      }
    } else {
      window.addEventListener('resize', this.renderChart);
    }

    void this.updateComplete.then(() => this.renderChart());
  }

  protected updated(changed: PropertyValues<this>): void {
    super.updated(changed);

    const logsKey: keyof DiaperSummaryCard = 'logs';
    const loadingKey: keyof DiaperSummaryCard = 'loading';

    if ((changed.has(logsKey) || changed.has(loadingKey)) && !this.loading) {
      void this.updateComplete.then(() => this.renderChart());
    }
  }

  disconnectedCallback(): void {
    this.resizeObserver?.disconnect();
    window.removeEventListener('resize', this.renderChart);
    super.disconnectedCallback();
  }

  private renderChart = () => {
    if (this.loading || !this.canvas) {
      return;
    }

    const chartData = buildDiaperChartData(this.logs);
    const hasData = chartData.some((point) => point.total > 0);

    if (!hasData) {
      const context = this.canvas.getContext('2d');
      if (context) {
        context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
      return;
    }

    drawDiaperChart({
      canvas: this.canvas,
      host: this,
      data: chartData,
    });
  };

  private formatDiaperCount(value: number): string {
    return this.numberFormatter.format(value);
  }

  private formatDiaperLabel(count: number): string {
    return count === 1 ? '1 diaper change' : `${count} diaper changes`;
  }

  private formatCount(value: number, suffix = ''): string {
    return value === 1 ? `1 ${suffix}` : `${value} ${suffix}${value === 1 ? '' : 's'}`.trim();
  }

  private formatTimestamp(timestamp: number | null): string {
    if (!timestamp || !Number.isFinite(timestamp)) {
      return 'Not yet recorded';
    }

    const formatter = new Intl.DateTimeFormat(undefined, {
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit',
    });

    return formatter.format(timestamp);
  }

  private formatInterval(minutes: number | null): string {
    if (!minutes || !Number.isFinite(minutes)) {
      return '—';
    }

    if (minutes < 60) {
      return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return this.formatCount(hours, 'hr');
    }
    return `${this.formatCount(hours, 'hr')} ${remainingMinutes} min`;
  }

  private computeSummary(): DiaperSummaryStats | null {
    if (!this.logs.length) {
      return null;
    }

    return calculateDiaperSummary(this.logs);
  }

  private renderLegend() {
    return html`
      <div class="summary-card__legend">
        <span class="summary-card__legend-item" style="color: var(--diaper-wet-color, #4f378b);">
          <span class="summary-card__legend-dot" aria-hidden="true"></span>
          Wet only
        </span>
        <span class="summary-card__legend-item" style="color: var(--diaper-both-color, #7d5260);">
          <span class="summary-card__legend-dot" aria-hidden="true"></span>
          Wet + dirty
        </span>
        <span class="summary-card__legend-item" style="color: var(--diaper-dirty-color, #625b71);">
          <span class="summary-card__legend-dot" aria-hidden="true"></span>
          Dirty only
        </span>
      </div>
    `;
  }

  render() {
    if (this.loading) {
      return html`<div class="summary-card" role="status" aria-live="polite">
        <div class="summary-card__empty">Loading diaper summary…</div>
      </div>`;
    }

    const summary = this.computeSummary();

    if (!summary) {
      return html`<div class="summary-card">
        <div class="summary-card__empty">
          Log a few diapers to see helpful trend insights for your pediatrician.
        </div>
      </div>`;
    }

    const total24 = summary.last24Hours.total;
    const total7 = summary.last7Days.total;
    const hasChartData = buildDiaperChartData(this.logs).some((point) => point.total > 0);
    const wet24 = summary.last24Hours.wet + summary.last24Hours.both;
    const dirty24 = summary.last24Hours.dirty + summary.last24Hours.both;
    const wet7 = summary.last7Days.wet + summary.last7Days.both;
    const dirty7 = summary.last7Days.dirty + summary.last7Days.both;

    return html`
      <div class="summary-card" role="status" aria-live="polite">
        <div class="summary-card__section">
          <span class="summary-card__title">Last 24 hours at a glance</span>
          ${total24 > 0
            ? html`
                <span class="summary-card__status">${this.formatDiaperLabel(total24)}</span>
                <div class="summary-card__chart">
                  ${hasChartData
                    ? html`
                        <canvas
                          role="img"
                          aria-label="Diaper frequency chart for the last 48 hours"
                        ></canvas>
                        ${this.renderLegend()}
                      `
                    : html`
                        <div class="summary-card__empty">
                          No chart data yet for the last 48 hours.
                        </div>
                      `}
                </div>
                <div class="summary-card__totals">
                  <span>${this.formatDiaperCount(total24)} diapers</span>
                  <span class="summary-card__secondary"
                    >(${this.formatDiaperCount(total7)} in last 7 days)</span
                  >
                </div>

                <div class="summary-card__highlights">
                  <div class="summary-card__highlight">
                    <span class="summary-card__highlight-label">Wet diapers</span>
                    <span class="summary-card__highlight-value">
                      ${this.formatDiaperCount(wet24)}
                      <span class="summary-card__highlight-subtle"
                        >${this.formatDiaperCount(wet7)} in last 7 days</span
                      >
                    </span>
                  </div>
                  <div class="summary-card__highlight">
                    <span class="summary-card__highlight-label">Dirty diapers</span>
                    <span class="summary-card__highlight-value">
                      ${this.formatDiaperCount(dirty24)}
                      <span class="summary-card__highlight-subtle"
                        >${this.formatDiaperCount(dirty7)} in last 7 days</span
                      >
                    </span>
                  </div>
                  <div class="summary-card__highlight">
                    <span class="summary-card__highlight-label">Average interval</span>
                    <span class="summary-card__highlight-value">
                      ${this.formatInterval(summary.averageIntervalMinutes)}
                      <span class="summary-card__highlight-subtle">between diaper changes</span>
                    </span>
                  </div>
                </div>

                <div class="summary-card__metadata">
                  <div class="summary-card__metadata-item">
                    <span class="summary-card__metadata-label">Last wet diaper</span>
                    <span class="summary-card__metadata-value"
                      >${this.formatTimestamp(summary.lastWetTime)}</span
                    >
                  </div>
                  <div class="summary-card__metadata-item">
                    <span class="summary-card__metadata-label">Last dirty diaper</span>
                    <span class="summary-card__metadata-value"
                      >${this.formatTimestamp(summary.lastDirtyTime)}</span
                    >
                  </div>
                </div>
              `
            : html`
                <span class="summary-card__status">No diapers logged in the last 24 hours</span>
                <div class="summary-card__empty">
                  Log a diaper to see helpful trend insights for your pediatrician.
                </div>
              `}
        </div>
      </div>
    `;
  }
}
