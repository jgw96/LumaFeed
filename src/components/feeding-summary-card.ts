import { LitElement, html, css, PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { FeedingLog } from '../types/feeding-log.js';
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

  private readonly handleWindowResize = () => {
    if (!this.loading) {
      this.drawChart();
    }
  };

  protected firstUpdated(): void {
    window.addEventListener('resize', this.handleWindowResize);
    void this.updateComplete.then(() => this.drawChart());
  }

  protected updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    const logsKey: keyof FeedingSummaryCard = 'logs';
    const loadingKey: keyof FeedingSummaryCard = 'loading';

    if ((changed.has(logsKey) || changed.has(loadingKey)) && !this.loading) {
      void this.updateComplete.then(() => this.drawChart());
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener('resize', this.handleWindowResize);
  }

  private calculateSummary(): { feedings: number; totalMl: number; totalOz: number } {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    let feedings = 0;
    let totalMl = 0;
    let totalOz = 0;

    for (const log of this.logs) {
      const timestamp = typeof log.endTime === 'number' ? log.endTime : log.timestamp;
      if (typeof timestamp === 'number' && timestamp >= cutoff) {
        feedings += 1;
        if (Number.isFinite(log.amountMl)) {
          totalMl += log.amountMl as number;
        }
        if (Number.isFinite(log.amountOz)) {
          totalOz += log.amountOz as number;
        }
      }
    }

    return { feedings, totalMl, totalOz };
  }

  private formatNumber(value: number, maxFractionDigits = 0): string {
    const hasFraction = Math.abs(value - Math.trunc(value)) > Number.EPSILON;
    return new Intl.NumberFormat(undefined, {
      maximumFractionDigits: maxFractionDigits,
      minimumFractionDigits: maxFractionDigits > 0 && hasFraction ? 1 : 0,
    }).format(value);
  }

  private formatFeedingLabel(count: number): string {
    return count === 1 ? '1 feeding' : `${count} feedings`;
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

  private filteredLogs(): Array<{ amount: number; timestamp: number }> {
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

  private drawChart(): void {
    const canvas = this.renderRoot?.querySelector<HTMLCanvasElement>('#feedChart');
    if (!canvas) {
      return;
    }

    const data = this.filteredLogs();
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;

    if (!displayWidth || !displayHeight) {
      return;
    }

    const dpr = window.devicePixelRatio ?? 1;
    const width = Math.floor(displayWidth * dpr);
    const height = Math.floor(displayHeight * dpr);

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, displayWidth, displayHeight);

    if (!data.length) {
      return;
    }

    const styles = getComputedStyle(this);
    const primaryColor = styles.getPropertyValue('--md-sys-color-primary').trim() || '#6750a4';
    const gridColor = styles.getPropertyValue('--md-sys-color-outline-variant').trim() || 'rgba(0,0,0,0.1)';
    const baselineColor = styles.getPropertyValue('--md-sys-color-outline').trim() || 'rgba(0,0,0,0.2)';
    const textColor = styles.getPropertyValue('--md-sys-color-on-surface-variant').trim() || '#625b71';

    const topPadding = 16;
    const leftPadding = data.length > 6 ? 28 : 16;
    const rightPadding = 16;
    const bottomPadding = data.length > 6 ? 64 : 32;
    const chartHeight = Math.max(0, displayHeight - topPadding - bottomPadding);
    const chartWidth = Math.max(0, displayWidth - leftPadding - rightPadding);

    const maxAmount = data.reduce((max, entry) => Math.max(max, entry.amount), 0);
    if (maxAmount <= 0 || chartWidth <= 0 || chartHeight <= 0) {
      return;
    }

    context.strokeStyle = gridColor;
    context.lineWidth = 1;
    context.font = '12px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    context.textBaseline = 'top';

    const gridLines = 4;
    for (let i = 1; i < gridLines; i += 1) {
      const ratio = i / gridLines;
      const y = topPadding + chartHeight - chartHeight * ratio;
      context.globalAlpha = 0.5;
      context.beginPath();
      context.moveTo(leftPadding, y);
      context.lineTo(leftPadding + chartWidth, y);
      context.stroke();
    }
    context.globalAlpha = 1;

    context.strokeStyle = baselineColor;
    context.beginPath();
    context.moveTo(leftPadding, topPadding + chartHeight + 0.5);
    context.lineTo(leftPadding + chartWidth, topPadding + chartHeight + 0.5);
    context.stroke();

    const barWidth = Math.max(6, chartWidth / (data.length * 1.7));
    const gap = data.length > 1 ? Math.max(4, (chartWidth - barWidth * data.length) / (data.length - 1)) : 0;
    const timeFormatter = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });

    let x = leftPadding;
    for (let i = 0; i < data.length; i += 1) {
      const entry = data[i];
      const barHeight = (entry.amount / maxAmount) * chartHeight;
      const y = topPadding + chartHeight - barHeight;

      context.fillStyle = primaryColor;
      context.globalAlpha = 0.85;
      context.fillRect(x, y, barWidth, barHeight);
      context.globalAlpha = 1;

      const timestamp = entry.timestamp;
      const label = timeFormatter.format(timestamp);

      context.save();
      const labelYOffset = data.length > 6 ? 20 : 10;
      context.translate(x + barWidth / 2, topPadding + chartHeight + labelYOffset);
      if (data.length > 6) {
        context.rotate(-Math.PI / 4);
        context.textAlign = 'right';
      } else {
        context.textAlign = 'center';
      }
      context.fillStyle = textColor;
      context.fillText(label, 0, 0);
      context.restore();

      x += barWidth + gap;
    }
  }

  render() {
  const summary = this.calculateSummary();
  const { feedings, totalMl, totalOz } = summary;
  const filtered = this.filteredLogs();
  const hasChartData = filtered.length > 0;

    return html`
      <div class="summary-card" role="status" aria-live="polite">
        <div class="summary-card__section">
          <span class="summary-card__title">Summary - Last 24 hours</span>
          ${this.loading
            ? html`<span class="summary-card__status">Loading summary…</span>`
            : feedings > 0
              ? html`
                  <span class="summary-card__status">${this.formatFeedingLabel(feedings)}</span>
                  <div class="summary-card__totals">
                    <span>${this.formatNumber(totalMl)} ml</span>
                    <span class="summary-card__secondary">(${this.formatNumber(totalOz, 1)} oz)</span>
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
                    : html`<div class="summary-card__empty">No chart data for the last 24 hours.</div>`}
                `
              : html`
                  <span class="summary-card__status">No feedings logged</span>
                  <div class="summary-card__empty">Add a feeding to see totals.</div>
                `}
        </div>

        <feeding-ai-summary-card
          class="summary-card__ai"
          .logs=${this.logs}
          .loading=${this.loading}
        ></feeding-ai-summary-card>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'feeding-summary-card': FeedingSummaryCard;
  }
}
