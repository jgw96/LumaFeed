import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { DiaperLog, StoolColor, StoolConsistency } from '../types/diaper-log.js';

const stoolColorLabels: Record<Exclude<StoolColor, null>, string> = {
  yellow: 'Yellow',
  green: 'Green',
  brown: 'Brown',
  black: 'Black (meconium)',
  red: 'Red',
  other: 'Other',
};

const stoolConsistencyLabels: Record<Exclude<StoolConsistency, null>, string> = {
  watery: 'Watery',
  seedy: 'Seedy',
  soft: 'Soft',
  pasty: 'Pasty',
  formed: 'Formed',
  mucousy: 'Mucousy',
};

@customElement('diaper-log-list')
export class DiaperLogList extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .log-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .log-item {
      background: var(--md-sys-color-surface-container-low);
      border: 1px solid var(--md-sys-color-outline-variant);
      border-radius: var(--md-sys-shape-corner-extra-large);
      padding: 1rem 1.25rem;
      transition:
        box-shadow 0.2s,
        background-color 0.2s;
    }

    .log-item:hover {
      box-shadow: var(--md-sys-elevation-1);
      background: var(--md-sys-color-surface-container);
    }

    .log-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      margin-bottom: 0.75rem;
    }

    .log-type {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      color: var(--md-sys-color-primary);
      font-size: 1rem;
    }

    .log-type::before {
      content: '';
      width: 10px;
      height: 10px;
      border-radius: 999px;
      background: linear-gradient(
        135deg,
        var(--diaper-wet-color, var(--md-sys-color-primary)) 0%,
        var(--diaper-dirty-color, var(--md-sys-color-tertiary)) 100%
      );
    }

    .log-time {
      color: var(--md-sys-color-on-surface-variant);
      font-size: 0.875rem;
      display: grid;
      gap: 0.25rem;
      text-align: right;
    }

    .log-time span:last-child {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .log-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 0.75rem;
      margin-top: 0.75rem;
    }

    .detail-item {
      display: grid;
      gap: 0.25rem;
    }

    .detail-label {
      color: var(--md-sys-color-on-surface-variant);
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 500;
    }

    .detail-value {
      color: var(--md-sys-color-on-surface);
      font-weight: 500;
      font-size: 1rem;
    }

    .notes {
      margin-top: 0.75rem;
      padding: 0.75rem 1rem;
      border-radius: var(--md-sys-shape-corner-medium);
      background: var(--md-sys-color-surface-container-lowest);
      border: 1px solid var(--md-sys-color-outline-variant);
      color: var(--md-sys-color-on-surface-variant);
      font-size: 0.95rem;
      line-height: 1.4;
    }

    .delete-btn {
      background: none;
      border: none;
      color: var(--md-sys-color-error);
      cursor: pointer;
      padding: 0.5rem;
      font-size: 1.5rem;
      line-height: 1;
      border-radius: 50%;
      transition:
        opacity 0.2s ease,
        background-color 0.2s ease;
    }

    .delete-btn:hover,
    .delete-btn:focus-visible {
      background: color-mix(in srgb, var(--md-sys-color-error) 8%, transparent);
      opacity: 0.85;
      outline: none;
    }

    .badges {
      display: inline-flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-top: 0.5rem;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.3rem 0.6rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 500;
      background: var(--md-sys-color-surface-container-high);
      color: var(--md-sys-color-on-surface);
      border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 70%, transparent);
    }

    .empty-state {
      text-align: center;
      padding: 3rem 1.5rem;
      color: var(--md-sys-color-on-surface);
      background: var(--md-sys-color-surface-container-low);
      border-radius: var(--md-sys-shape-corner-large);
      display: grid;
      gap: 1.5rem;
      max-width: 480px;
      margin: 0 auto;
    }

    .empty-state h3 {
      margin: 0;
      font-size: var(--md-sys-typescale-headline-small-font-size);
      font-weight: var(--md-sys-typescale-headline-small-font-weight);
    }

    .empty-state p {
      margin: 0;
      color: var(--md-sys-color-on-surface-variant);
      font-size: var(--md-sys-typescale-body-medium-font-size);
      line-height: var(--md-sys-typescale-body-medium-line-height);
    }

    .empty-state button {
      justify-self: center;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--md-comp-button-gap);
      min-height: var(--md-comp-button-height);
      padding: 0 var(--md-comp-button-horizontal-padding);
      border: none;
      border-radius: var(--md-comp-button-shape);
      background: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-primary);
      font-weight: var(--md-sys-typescale-label-large-font-weight);
      font-size: var(--md-sys-typescale-label-large-font-size);
      line-height: var(--md-sys-typescale-label-large-line-height);
      letter-spacing: var(--md-sys-typescale-label-large-letter-spacing);
      cursor: pointer;
      transition:
        background-color 0.2s ease,
        box-shadow 0.2s ease;
      box-shadow: var(--md-sys-elevation-1);
    }

    .empty-state button:hover,
    .empty-state button:focus-visible {
      background: var(--md-sys-color-primary-container);
      color: var(--md-sys-color-on-primary-container);
      box-shadow: var(--md-sys-elevation-2);
      outline: none;
    }
  `;

  @property({ type: Array })
  logs: DiaperLog[] = [];

  private dateFormatter = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  private relativeFormatter =
    typeof Intl.RelativeTimeFormat === 'function'
      ? new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
      : null;

  private formatLogType(log: DiaperLog): string {
    if (log.wet && log.dirty) {
      return 'Wet + dirty diaper';
    }

    if (log.wet) {
      return 'Wet diaper';
    }

    if (log.dirty) {
      return 'Dirty diaper';
    }

    return 'Diaper';
  }

  private formatRelative(timestamp: number): string | null {
    if (!this.relativeFormatter || !Number.isFinite(timestamp)) {
      return null;
    }

    const now = Date.now();
    const diffMs = timestamp - now;
    const diffMinutes = Math.round(diffMs / 60_000);

    if (Math.abs(diffMinutes) < 60) {
      return this.relativeFormatter.format(diffMinutes, 'minute');
    }

    const diffHours = Math.round(diffMs / 3_600_000);
    if (Math.abs(diffHours) < 48) {
      return this.relativeFormatter.format(diffHours, 'hour');
    }

    const diffDays = Math.round(diffMs / 86_400_000);
    return this.relativeFormatter.format(diffDays, 'day');
  }

  private renderLog(log: DiaperLog) {
    const timestamp = Number.isFinite(log.timestamp) ? log.timestamp : Date.now();
    const relative = this.formatRelative(timestamp);
    const formattedTime = this.dateFormatter.format(timestamp);

    const stoolDetails: Array<{ label: string; value: string }> = [];
    if (log.dirty && log.stoolColor) {
      stoolDetails.push({
        label: 'Stool color',
        value: stoolColorLabels[log.stoolColor] ?? 'Unspecified',
      });
    }

    if (log.dirty && log.stoolConsistency) {
      stoolDetails.push({
        label: 'Consistency',
        value: stoolConsistencyLabels[log.stoolConsistency] ?? 'Unspecified',
      });
    }

    if (log.dirty && log.containsMucus) {
      stoolDetails.push({ label: 'Observation', value: 'Contains mucus' });
    }

    if (log.dirty && log.containsBlood) {
      stoolDetails.push({ label: 'Observation', value: 'Trace blood' });
    }

    const hasNotes = typeof log.notes === 'string' && log.notes.trim().length > 0;

    return html`
      <article class="log-item">
        <header class="log-header">
          <div>
            <div class="log-type">${this.formatLogType(log)}</div>
            <div class="badges">
              ${log.wet ? html`<span class="badge">Pee</span>` : null}
              ${log.dirty ? html`<span class="badge">Poop</span>` : null}
              ${log.wet && log.dirty ? html`<span class="badge">Double</span>` : null}
            </div>
          </div>
          <div class="log-time">
            <span>${formattedTime}</span>
            ${relative ? html`<span>${relative}</span>` : null}
          </div>
          <button
            class="delete-btn"
            type="button"
            @click=${() => this.handleDelete(log.id)}
            aria-label="Delete diaper log"
          >
            ×
          </button>
        </header>
        <div class="log-details" role="list">
          <div class="detail-item">
            <span class="detail-label">Recorded</span>
            <span class="detail-value">${formattedTime}</span>
          </div>
          ${stoolDetails.map(
            (detail) => html`
              <div class="detail-item">
                <span class="detail-label">${detail.label}</span>
                <span class="detail-value">${detail.value}</span>
              </div>
            `
          )}
        </div>
        ${hasNotes ? html`<div class="notes">${log.notes.trim()}</div>` : null}
      </article>
    `;
  }

  private handleAddClick() {
    this.dispatchEvent(
      new CustomEvent('log-add-requested', {
        bubbles: true,
        composed: true,
      })
    );
  }

  private handleDelete(logId: string) {
    this.dispatchEvent(
      new CustomEvent('log-deleted', {
        detail: logId,
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    if (!this.logs.length) {
      return html`
        <div class="empty-state">
          <h3>Track diaper changes</h3>
          <p>
            Keeping an eye on wet and dirty diapers helps your pediatrician check hydration and
            digestion. Start logging to build a clear daily picture.
          </p>
          <button type="button" @click=${this.handleAddClick}>Log a diaper</button>
        </div>
      `;
    }

    return html`<div class="log-list">${this.logs.map((log) => this.renderLog(log))}</div>`;
  }
}
