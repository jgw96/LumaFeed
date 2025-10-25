import { LitElement, html, css } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';

import type { FeedingLog } from '../types/feeding-log.js';
import type { DiaperLog } from '../types/diaper-log.js';
import { feedingStorage } from '../services/feeding-storage.js';
import { diaperStorage } from '../services/diaper-storage.js';

import '../components/feeding-summary-card.js';
import '../components/diaper-summary-card.js';

@customElement('insights-page')
export class InsightsPage extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 1.5rem;
      color: var(--md-sys-color-on-background);
      background-color: var(--md-sys-color-background);
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
    }

    .page-title {
      color: var(--md-sys-color-on-surface);
      font-size: var(--md-sys-typescale-headline-large-font-size);
      font-weight: var(--md-sys-typescale-headline-large-font-weight);
      line-height: var(--md-sys-typescale-headline-large-line-height);
      margin-bottom: 1.5rem;
    }

    .section {
      margin-bottom: 2rem;
    }

    .section-title {
      color: var(--md-sys-color-on-surface);
      font-size: var(--md-sys-typescale-title-large-font-size);
      font-weight: var(--md-sys-typescale-title-large-font-weight);
      line-height: var(--md-sys-typescale-title-large-line-height);
      margin-bottom: 1rem;
    }

    .lifetime-stats {
      background: var(--md-sys-color-surface-container-low);
      border-radius: var(--md-sys-shape-corner-extra-large);
      border: 1px solid var(--md-sys-color-outline-variant);
      padding: 1.25rem 1.5rem;
      box-shadow: var(--md-sys-elevation-1);
      margin-bottom: 2rem;
      display: grid;
      gap: 1.5rem;
    }

    .lifetime-stats__header {
      display: grid;
      gap: 0.5rem;
    }

    .lifetime-stats__title {
      font-weight: 600;
      color: var(--md-sys-color-primary);
      font-size: 1rem;
      line-height: 1.5;
    }

    .lifetime-stats__subtitle {
      font-size: var(--md-sys-typescale-body-medium-font-size);
      line-height: var(--md-sys-typescale-body-medium-line-height);
      color: var(--md-sys-color-on-surface-variant);
    }

    .lifetime-stats__highlight {
      background: var(--md-sys-color-secondary-container);
      color: var(--md-sys-color-on-secondary-container);
      border-radius: var(--md-sys-shape-corner-large);
      padding: 1rem 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .lifetime-stats__highlight-item {
      display: grid;
      gap: 0.25rem;
    }

    .lifetime-stats__highlight-label {
      font-size: var(--md-sys-typescale-label-small-font-size);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      opacity: 0.9;
    }

    .lifetime-stats__highlight-value {
      font-size: var(--md-sys-typescale-title-large-font-size);
      font-weight: var(--md-sys-typescale-title-large-font-weight);
      line-height: var(--md-sys-typescale-title-large-line-height);
    }

    .stats-sections {
      display: grid;
      gap: 1.25rem;
    }

    .stats-section {
      display: grid;
      gap: 0.75rem;
    }

    .stats-section__title {
      font-size: var(--md-sys-typescale-title-small-font-size);
      font-weight: var(--md-sys-typescale-title-small-font-weight);
      color: var(--md-sys-color-on-surface);
    }

    .stats-grid {
      display: grid;
      gap: 0.75rem;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    }

    .stat-card {
      background: var(--md-sys-color-surface-container-lowest);
      border-radius: var(--md-sys-shape-corner-large);
      border: 1px solid var(--md-sys-color-outline-variant);
      padding: 0.75rem 1rem;
      display: grid;
      gap: 0.25rem;
    }

    .stat-card__label {
      font-size: var(--md-sys-typescale-label-small-font-size);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--md-sys-color-on-surface-variant);
    }

    .stat-card__value {
      color: var(--md-sys-color-on-surface);
      font-weight: var(--md-sys-typescale-title-small-font-weight);
      font-size: var(--md-sys-typescale-title-small-font-size);
    }

    .stat-card__secondary {
      font-size: var(--md-sys-typescale-body-small-font-size);
      color: color-mix(in srgb, var(--md-sys-color-on-surface) 70%, transparent);
    }

    .timeline-chart-container {
      background: var(--md-sys-color-surface-container-low);
      border-radius: var(--md-sys-shape-corner-extra-large);
      border: 1px solid var(--md-sys-color-outline-variant);
      padding: 1.25rem 1.5rem;
      box-shadow: var(--md-sys-elevation-1);
      margin-bottom: 2rem;
      display: grid;
      gap: 1rem;
    }

    .timeline-chart__title {
      font-weight: 600;
      color: var(--md-sys-color-primary);
      font-size: 1rem;
      line-height: 1.5;
    }

    .timeline-chart__canvas-wrapper {
      position: relative;
      width: 100%;
      height: 240px;
    }

    .timeline-chart__canvas-wrapper canvas {
      width: 100%;
      height: 100%;
      display: block;
      border-radius: var(--md-sys-shape-corner-large);
      background: var(--md-sys-color-surface-container);
    }

    .timeline-chart__legend {
      display: flex;
      flex-wrap: wrap;
      gap: 1.5rem;
      justify-content: center;
      font-size: var(--md-sys-typescale-label-medium-font-size);
      color: var(--md-sys-color-on-surface-variant);
    }

    .timeline-chart__legend-item {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .timeline-chart__legend-dot {
      width: 12px;
      height: 12px;
      border-radius: 999px;
      background: currentColor;
    }

    .timeline-chart__legend-dot--feeding {
      color: var(--md-sys-color-primary);
    }

    .timeline-chart__legend-dot--diaper {
      color: var(--md-sys-color-secondary);
    }
  `;

  @state()
  private feedingLogs: FeedingLog[] = [];

  @state()
  private diaperLogs: DiaperLog[] = [];

  @state()
  private loading = true;

  @query('.timeline-chart__canvas-wrapper canvas')
  private timelineCanvas?: HTMLCanvasElement;

  private resizeObserver?: ResizeObserver;

  async connectedCallback() {
    super.connectedCallback();
    await this.loadData();
    await this.updateComplete;
    this.setupChart();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.resizeObserver?.disconnect();
  }

  private async loadData() {
    this.loading = true;
    try {
      const [feedingLogs, diaperLogs] = await Promise.all([
        feedingStorage.loadLogs(),
        diaperStorage.loadLogs(),
      ]);
      this.feedingLogs = feedingLogs;
      this.diaperLogs = diaperLogs;
    } catch (error) {
      console.error('Error loading data for insights:', error);
    } finally {
      this.loading = false;
      await this.updateComplete;
      this.drawTimelineChart();
    }
  }

  private setupChart() {
    if (!this.timelineCanvas) {
      return;
    }

    this.resizeObserver = new ResizeObserver(() => {
      this.drawTimelineChart();
    });

    this.resizeObserver.observe(this.timelineCanvas);
    this.drawTimelineChart();
  }

  private buildTimelineData(): Array<{ date: string; feedings: number; diapers: number }> {
    // Get all unique dates from both logs
    const dateMap = new Map<string, { feedings: number; diapers: number }>();

    // Helper to format date as YYYY-MM-DD
    const formatDate = (timestamp: number): string => {
      const date = new Date(timestamp);
      return date.toISOString().split('T')[0];
    };

    // Count feedings per day
    this.feedingLogs.forEach((log) => {
      const dateKey = formatDate(log.endTime);
      const existing = dateMap.get(dateKey) || { feedings: 0, diapers: 0 };
      existing.feedings += 1;
      dateMap.set(dateKey, existing);
    });

    // Count diapers per day
    this.diaperLogs.forEach((log) => {
      const dateKey = formatDate(log.timestamp);
      const existing = dateMap.get(dateKey) || { feedings: 0, diapers: 0 };
      existing.diapers += 1;
      dateMap.set(dateKey, existing);
    });

    // Convert to array and sort by date
    const data = Array.from(dateMap.entries())
      .map(([date, counts]) => ({
        date,
        feedings: counts.feedings,
        diapers: counts.diapers,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Limit to last 30 days for readability
    return data.slice(-30);
  }

  private async drawTimelineChart() {
    if (!this.timelineCanvas) {
      return;
    }

    const data = this.buildTimelineData();
    if (data.length === 0) {
      return;
    }

    const { drawTimelineChart } = await import('../utils/insights/draw-timeline-chart.js');
    drawTimelineChart({
      canvas: this.timelineCanvas,
      host: this,
      data,
    });
  }

  private calculateLifetimeStats() {
    const totalFeedings = this.feedingLogs.length;
    const totalDiapers = this.diaperLogs.length;

    // Calculate total feeding volume
    const totalVolumeMl = this.feedingLogs.reduce((sum, log) => {
      return sum + (log.amountMl ?? 0);
    }, 0);

    // Calculate total feeding time
    const totalFeedingMinutes = this.feedingLogs.reduce((sum, log) => {
      return sum + (log.durationMinutes ?? 0);
    }, 0);

    // Calculate average feeding volume
    const avgVolumeMl = totalFeedings > 0 ? totalVolumeMl / totalFeedings : 0;

    // Calculate diaper breakdown
    const wetOnly = this.diaperLogs.filter((log) => log.wet && !log.dirty).length;
    const dirtyOnly = this.diaperLogs.filter((log) => !log.wet && log.dirty).length;
    const both = this.diaperLogs.filter((log) => log.wet && log.dirty).length;

    // Get oldest log timestamp to calculate days tracked
    const allTimestamps = [
      ...this.feedingLogs.map((log) => log.endTime),
      ...this.diaperLogs.map((log) => log.timestamp),
    ];
    const oldestTimestamp = allTimestamps.length > 0 ? Math.min(...allTimestamps) : Date.now();
    const daysTracked = Math.max(1, Math.ceil((Date.now() - oldestTimestamp) / (1000 * 60 * 60 * 24)));

    return {
      totalFeedings,
      totalDiapers,
      totalVolumeMl,
      totalFeedingMinutes,
      avgVolumeMl,
      wetOnly,
      dirtyOnly,
      both,
      daysTracked,
    };
  }

  private formatVolume(ml: number): string {
    return `${Math.round(ml)} ml`;
  }

  private formatVolumeOz(ml: number): string {
    const oz = ml / 29.5735;
    return `${oz.toFixed(1)} oz`;
  }

  private formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }

  private formatDurationLong(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'}, ${mins} ${mins === 1 ? 'minute' : 'minutes'}`;
    }
    return `${mins} ${mins === 1 ? 'minute' : 'minutes'}`;
  }

  render() {
    const stats = this.calculateLifetimeStats();

    return html`
      <div class="container">
        <h1 class="page-title">Insights</h1>

        <div class="lifetime-stats">
          <div class="lifetime-stats__header">
            <div class="lifetime-stats__title">📊 Lifetime Stats</div>
            <div class="lifetime-stats__subtitle">
              Tracking since ${stats.daysTracked} ${stats.daysTracked === 1 ? 'day' : 'days'} ago
            </div>
          </div>

          <div class="lifetime-stats__highlight">
            <div class="lifetime-stats__highlight-item">
              <div class="lifetime-stats__highlight-label">Total Feedings</div>
              <div class="lifetime-stats__highlight-value">${stats.totalFeedings}</div>
            </div>
            <div class="lifetime-stats__highlight-item">
              <div class="lifetime-stats__highlight-label">Total Diapers</div>
              <div class="lifetime-stats__highlight-value">${stats.totalDiapers}</div>
            </div>
          </div>

          <div class="stats-sections">
            <div class="stats-section">
              <div class="stats-section__title">Feeding Totals</div>
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-card__label">Total Volume</div>
                  <div class="stat-card__value">${this.formatVolume(stats.totalVolumeMl)}</div>
                  <div class="stat-card__secondary">${this.formatVolumeOz(stats.totalVolumeMl)}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-card__label">Avg per Feeding</div>
                  <div class="stat-card__value">${this.formatVolume(stats.avgVolumeMl)}</div>
                  <div class="stat-card__secondary">${this.formatVolumeOz(stats.avgVolumeMl)}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-card__label">Total Time</div>
                  <div class="stat-card__value">${this.formatDuration(stats.totalFeedingMinutes)}</div>
                  <div class="stat-card__secondary">${this.formatDurationLong(stats.totalFeedingMinutes)}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-card__label">Avg Duration</div>
                  <div class="stat-card__value">
                    ${stats.totalFeedings > 0 ? this.formatDuration(stats.totalFeedingMinutes / stats.totalFeedings) : '—'}
                  </div>
                </div>
              </div>
            </div>

            <div class="stats-section">
              <div class="stats-section__title">Diaper Breakdown</div>
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-card__label">Wet Only</div>
                  <div class="stat-card__value">${stats.wetOnly}</div>
                  <div class="stat-card__secondary">
                    ${stats.totalDiapers > 0 ? Math.round((stats.wetOnly / stats.totalDiapers) * 100) : 0}%
                  </div>
                </div>
                <div class="stat-card">
                  <div class="stat-card__label">Dirty Only</div>
                  <div class="stat-card__value">${stats.dirtyOnly}</div>
                  <div class="stat-card__secondary">
                    ${stats.totalDiapers > 0 ? Math.round((stats.dirtyOnly / stats.totalDiapers) * 100) : 0}%
                  </div>
                </div>
                <div class="stat-card">
                  <div class="stat-card__label">Both</div>
                  <div class="stat-card__value">${stats.both}</div>
                  <div class="stat-card__secondary">
                    ${stats.totalDiapers > 0 ? Math.round((stats.both / stats.totalDiapers) * 100) : 0}%
                  </div>
                </div>
                <div class="stat-card">
                  <div class="stat-card__label">Avg per Day</div>
                  <div class="stat-card__value">
                    ${(stats.totalDiapers / stats.daysTracked).toFixed(1)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="timeline-chart-container">
          <div class="timeline-chart__title">📈 Daily Activity (Last 30 Days)</div>
          <div class="timeline-chart__canvas-wrapper">
            <canvas></canvas>
          </div>
          <div class="timeline-chart__legend">
            <div class="timeline-chart__legend-item">
              <span class="timeline-chart__legend-dot timeline-chart__legend-dot--feeding"></span>
              <span>Feedings</span>
            </div>
            <div class="timeline-chart__legend-item">
              <span class="timeline-chart__legend-dot timeline-chart__legend-dot--diaper"></span>
              <span>Diapers</span>
            </div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">Recent Feeding Trends</h2>
          <feeding-summary-card
            .logs=${this.feedingLogs}
            .loading=${this.loading}
            .showAiSummary=${false}
          ></feeding-summary-card>
        </div>

        <div class="section">
          <h2 class="section-title">Recent Diaper Patterns</h2>
          <diaper-summary-card
            .logs=${this.diaperLogs}
            .loading=${this.loading}
          ></diaper-summary-card>
        </div>
      </div>
    `;
  }
}
