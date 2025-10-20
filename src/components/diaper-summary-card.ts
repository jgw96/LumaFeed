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

    .summary-grid {
      display: grid;
      gap: 1.5rem;
    }

    @media (min-width: 720px) {
      .summary-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    .summary-card {
      background: var(--md-sys-color-surface-container-low);
      border-radius: var(--md-sys-shape-corner-extra-large);
      border: 1px solid var(--md-sys-color-outline-variant);
      padding: 1.25rem 1.5rem;
      box-shadow: var(--md-sys-elevation-1);
      display: grid;
      gap: 1rem;
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

    .summary-card__metrics {
      display: grid;
      gap: 0.75rem;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    }

    .summary-card__metric {
      background: var(--md-sys-color-surface-container-lowest);
      border-radius: var(--md-sys-shape-corner-large);
      border: 1px solid var(--md-sys-color-outline-variant);
      padding: 0.75rem 1rem;
      display: grid;
      gap: 0.25rem;
    }

    .summary-card__metric-label {
      font-size: var(--md-sys-typescale-label-small-font-size);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--md-sys-color-on-surface-variant);
    }

    .summary-card__metric-value {
      color: var(--md-sys-color-on-surface);
      font-weight: var(--md-sys-typescale-title-small-font-weight);
      font-size: var(--md-sys-typescale-title-small-font-size);
    }

    .summary-card__metric-subtle {
      font-size: var(--md-sys-typescale-body-small-font-size);
      color: color-mix(in srgb, var(--md-sys-color-on-surface) 80%, transparent);
    }

    .summary-card__metadata {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 0.75rem;
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
      height: 220px;
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

    .summary-card__helper {
      font-size: var(--md-sys-typescale-body-small-font-size);
      color: var(--md-sys-color-on-surface-variant);
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

  private readonly averageFormatter = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 1,
  });

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

    const chartData = buildDiaperChartData(this.logs, {
      hoursSpan: 7 * 24,
      bucketSizeHours: 24,
    });
    const hasData = chartData.some((point) => point.total > 0);

    if (!hasData) {
      const context = this.canvas.getContext('2d');
      if (context) {
        context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
      return;
    }

    const weekdayFormatter = new Intl.DateTimeFormat(undefined, {
      weekday: 'short',
    });

    drawDiaperChart({
      canvas: this.canvas,
      host: this,
      data: chartData,
      labelFormatter: (timestamp) => weekdayFormatter.format(timestamp),
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
      return html`
        <div class="summary-grid" role="status" aria-live="polite">
          <section class="summary-card">
            <div class="summary-card__empty">Loading diaper summary…</div>
          </section>
          <section class="summary-card">
            <div class="summary-card__empty">Loading diaper summary…</div>
          </section>
        </div>
      `;
    }

    const summary = this.computeSummary();
    const hasAnyLogs = summary !== null;
    const safeSummary: DiaperSummaryStats =
      summary ?? {
        last24Hours: { wet: 0, dirty: 0, both: 0, total: 0 },
        last7Days: { wet: 0, dirty: 0, both: 0, total: 0 },
        lastWetTime: null,
        lastDirtyTime: null,
        averageIntervalMinutes: null,
      };

    const total24 = safeSummary.last24Hours.total;
    const wet24 = safeSummary.last24Hours.wet + safeSummary.last24Hours.both;
    const dirty24 = safeSummary.last24Hours.dirty + safeSummary.last24Hours.both;

    const total7 = safeSummary.last7Days.total;
    const wet7 = safeSummary.last7Days.wet + safeSummary.last7Days.both;
    const dirty7 = safeSummary.last7Days.dirty + safeSummary.last7Days.both;

    const averagePerDay = total7 > 0 ? total7 / 7 : 0;
    const formattedAveragePerDay = total7 > 0 ? this.averageFormatter.format(averagePerDay) : '—';

    const hasWeeklyChartData = buildDiaperChartData(this.logs, {
      hoursSpan: 7 * 24,
      bucketSizeHours: 24,
    }).some((point) => point.total > 0);

    const empty24Message = hasAnyLogs
      ? 'No diapers logged in the last 24 hours.'
      : 'No diapers logged yet.';
    const empty7Message = hasAnyLogs
      ? 'No diapers logged in the last 7 days.'
      : 'Log a few diapers to see weekly trends for your pediatrician.';
    const empty7Helper = hasAnyLogs
      ? 'Keep logging diapers and we will surface weekly trends here.'
      : 'Once you have a few days of history we will surface averages and charts here.';

    return html`
      <div class="summary-grid" role="region" aria-live="polite">
        <section class="summary-card" aria-label="Last 24 hours">
          <span class="summary-card__title">Last 24 hours</span>
          ${total24 > 0
            ? html`
                <span class="summary-card__status">${this.formatDiaperLabel(total24)}</span>
                <div class="summary-card__metrics">
                  <div class="summary-card__metric">
                    <span class="summary-card__metric-label">Total changes</span>
                    <span class="summary-card__metric-value"
                      >${this.formatDiaperCount(total24)}</span
                    >
                  </div>
                  <div class="summary-card__metric">
                    <span class="summary-card__metric-label">Wet diapers</span>
                    <span class="summary-card__metric-value"
                      >${this.formatDiaperCount(wet24)}</span
                    >
                  </div>
                  <div class="summary-card__metric">
                    <span class="summary-card__metric-label">Dirty diapers</span>
                    <span class="summary-card__metric-value"
                      >${this.formatDiaperCount(dirty24)}</span
                    >
                  </div>
                  <div class="summary-card__metric">
                    <span class="summary-card__metric-label">Average interval</span>
                    <span class="summary-card__metric-value"
                      >${this.formatInterval(safeSummary.averageIntervalMinutes)}</span
                    >
                  </div>
                </div>
                <div class="summary-card__metadata">
                  <div class="summary-card__metadata-item">
                    <span class="summary-card__metadata-label">Last wet diaper</span>
                    <span class="summary-card__metadata-value"
                      >${this.formatTimestamp(safeSummary.lastWetTime)}</span
                    >
                  </div>
                  <div class="summary-card__metadata-item">
                    <span class="summary-card__metadata-label">Last dirty diaper</span>
                    <span class="summary-card__metadata-value"
                      >${this.formatTimestamp(safeSummary.lastDirtyTime)}</span
                    >
                  </div>
                </div>
              `
            : html`
                <div class="summary-card__empty">${empty24Message}</div>
                <p class="summary-card__helper">
                  Log changes to keep an eye on today's diaper activity.
                </p>
              `}
        </section>
        <section class="summary-card" aria-label="Last 7 days">
          <span class="summary-card__title">Last 7 days</span>
          ${total7 > 0
            ? html`
                <span class="summary-card__status"
                  >${this.formatDiaperCount(total7)} diaper changes this week</span
                >
                <div class="summary-card__metrics">
                  <div class="summary-card__metric">
                    <span class="summary-card__metric-label">Total changes</span>
                    <span class="summary-card__metric-value"
                      >${this.formatDiaperCount(total7)}</span
                    >
                  </div>
                  <div class="summary-card__metric">
                    <span class="summary-card__metric-label">Average per day</span>
                    <span class="summary-card__metric-value"
                      >${formattedAveragePerDay}</span
                    >
                    <span class="summary-card__metric-subtle">over the last week</span>
                  </div>
                  <div class="summary-card__metric">
                    <span class="summary-card__metric-label">Wet diapers</span>
                    <span class="summary-card__metric-value"
                      >${this.formatDiaperCount(wet7)}</span
                    >
                  </div>
                  <div class="summary-card__metric">
                    <span class="summary-card__metric-label">Dirty diapers</span>
                    <span class="summary-card__metric-value"
                      >${this.formatDiaperCount(dirty7)}</span
                    >
                  </div>
                </div>
                <div class="summary-card__chart">
                  ${hasWeeklyChartData
                    ? html`
                        <canvas
                          role="img"
                          aria-label="Diaper changes per day for the last 7 days"
                        ></canvas>
                        ${this.renderLegend()}
                      `
                    : html`
                        <div class="summary-card__empty">
                          Trend data will appear after a few days of tracking.
                        </div>
                      `}
                </div>
              `
            : html`
                <div class="summary-card__empty">${empty7Message}</div>
                <p class="summary-card__helper">${empty7Helper}</p>
              `}
        </section>
      </div>
    `;
  }
}
