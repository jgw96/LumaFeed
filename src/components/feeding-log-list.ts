import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { FeedingLog } from '../types/feeding-log.js';
import { formatNextFeedLabel } from '../utils/feed-time.js';

@customElement('feeding-log-list')
export class FeedingLogList extends LitElement {
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
      transition: box-shadow 0.2s, background-color 0.2s;
    }

    .log-item:hover {
      box-shadow: var(--md-sys-elevation-1);
      background: var(--md-sys-color-surface-container);
    }

    .log-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .log-type {
      font-weight: 600;
      color: var(--md-sys-color-primary);
      font-size: 1rem;
      line-height: 1.5;
    }

    .log-time {
      color: var(--md-sys-color-on-surface-variant);
      font-size: 0.875rem;
    }

    .log-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 0.75rem;
      margin-top: 0.75rem;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
    }

    .detail-label {
      color: var(--md-sys-color-on-surface-variant);
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.25rem;
      font-weight: 500;
    }

    .detail-value {
      color: var(--md-sys-color-on-surface);
      font-weight: 500;
      font-size: 1rem;
    }

    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--md-sys-color-on-surface-variant);
      background: var(--md-sys-color-surface-container-low);
      border-radius: var(--md-sys-shape-corner-large);
    }

    .empty-state-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      opacity: 0.7;
    }

    .delete-btn {
      background: none;
      border: none;
      color: var(--md-sys-color-error);
      cursor: pointer;
      padding: 0.5rem;
      font-size: 1.5rem;
      transition: opacity 0.2s, background-color 0.2s;
      border-radius: var(--md-sys-shape-corner-extra-small);
      width: 2.5rem;
      height: 2.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .delete-btn:hover {
      background-color: var(--md-sys-color-error-container);
      opacity: 0.9;
    }
  `;

  @property({ type: Array })
  logs: FeedingLog[] = [];

  private formatTimeRange(log: FeedingLog): string {
    const start = new Date(log.startTime ?? log.timestamp);
    const end = new Date(log.endTime ?? log.timestamp);
    const now = new Date();
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      const fallbackDate = new Date(log.timestamp);
      const day = fallbackDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const time = fallbackDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      return `${day} · ${time}`;
    }

    const isSameDay = start.toDateString() === end.toDateString();
    const isToday = start.toDateString() === now.toDateString();
    const isYesterday = start.toDateString() === yesterday.toDateString();

    const formatTime = (value: Date) => value.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const startTime = formatTime(start);
    const endTime = formatTime(end);

    if (isSameDay) {
      const dayLabel = isToday
        ? 'Today'
        : isYesterday
          ? 'Yesterday'
          : start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${dayLabel} · ${startTime} – ${endTime}`;
    }

    const startDate = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endDate = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${startDate} ${startTime} – ${endDate} ${endTime}`;
  }

  private handleDelete(log: FeedingLog) {
    this.dispatchEvent(new CustomEvent('log-deleted', { 
      detail: log.id,
      bubbles: true,
      composed: true 
    }));
  }

  render() {
    if (this.logs.length === 0) {
      return html`
        <div class="empty-state">
          <div class="empty-state-icon">🍼</div>
          <p>No feeding logs yet. Add your first feeding session!</p>
        </div>
      `;
    }

    return html`
      <div class="log-list">
        ${this.logs.map(log => html`
          <div class="log-item">
            <div class="log-header">
              <div class="log-type">
                ${log.feedType === 'formula' ? '🍼 Formula' : '🤱 Breast Milk'}
              </div>
              <div style="display: flex; align-items: center; gap: 1rem;">
                <div class="log-time">${this.formatTimeRange(log)}</div>
                <button 
                  class="delete-btn" 
                  @click=${() => this.handleDelete(log)}
                  title="Delete log"
                >
                  ×
                </button>
              </div>
            </div>
            <div class="log-details">
              <div class="detail-item">
                <div class="detail-label">Amount</div>
                <div class="detail-value">${log.amountMl} ml (${log.amountOz} fl oz)</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Duration</div>
                <div class="detail-value">${log.durationMinutes} min</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Method</div>
                <div class="detail-value">${log.isBottleFed ? 'Bottle' : 'Breast'}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Next feed</div>
                <div class="detail-value">${formatNextFeedLabel(log.nextFeedTime)}</div>
              </div>
            </div>
          </div>
        `)}
      </div>
    `;
  }
}
