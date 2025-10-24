import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { FeedingLog } from '../types/feeding-log.js';

import { formatNextFeedLabel } from '../utils/feed-time.js';
import { emptyStateStyles } from './empty-state-styles.js';

@customElement('feeding-log-list')
export class FeedingLogList extends LitElement {
  static styles = [
    css`
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
        cursor: pointer;
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

      .delete-btn {
        background: none;
        border: none;
        color: var(--md-sys-color-error);
        cursor: pointer;
        padding: 0.5rem;
        font-size: 1.5rem;
        transition:
          opacity 0.2s ease,
          background-color 0.2s ease;
        border-radius: 50%;
        width: 2.5rem;
        height: 2.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .delete-btn:hover,
      .delete-btn:focus-visible {
        background-color: var(--md-sys-color-error-container);
        opacity: 0.9;
        outline: none;
      }
    `,
    emptyStateStyles,
  ];

  @property({ type: Array })
  logs: FeedingLog[] = [];

  private handleEmptyStateAction() {
    this.dispatchEvent(
      new CustomEvent('log-add-requested', {
        bubbles: true,
        composed: true,
      })
    );
  }

  private formatTimeRange(log: FeedingLog): string {
    const start = new Date(log.startTime ?? log.timestamp);
    const end = new Date(log.endTime ?? log.timestamp);
    const now = new Date();
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      const fallbackDate = new Date(log.timestamp);
      const day = fallbackDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const time = fallbackDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      return `${day} · ${time}`;
    }

    const isSameDay = start.toDateString() === end.toDateString();
    const isToday = start.toDateString() === now.toDateString();
    const isYesterday = start.toDateString() === yesterday.toDateString();

    const formatTime = (value: Date) =>
      value.toLocaleTimeString('en-US', {
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
    this.dispatchEvent(
      new CustomEvent('log-deleted', {
        detail: log.id,
        bubbles: true,
        composed: true,
      })
    );
  }

  private handleLogClick(log: FeedingLog) {
    // Navigate to log detail page
    window.history.pushState({}, '', `/log?id=${log.id}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }

  private handleDeleteClick(e: Event, log: FeedingLog) {
    // Prevent navigation to detail page
    e.stopPropagation();
    this.handleDelete(log);
  }

  render() {
    if (this.logs.length === 0) {
      return html`
        <div class="empty-state" role="status" aria-live="polite">
          <div>
            <div class="empty-state-icon" aria-hidden="true">
              <img src="/feedings-65.png" alt="Feeding icon" width="48" height="48" />
            </div>
            <h3 class="empty-state-title">Start tracking feedings</h3>
            <p class="empty-state-description">
              Capture nursing or bottle sessions, keep an eye on timing, and know exactly when the
              next feeding is due.
            </p>
          </div>
          <ul class="empty-state-highlights" aria-label="Benefits of logging feedings">
            <li class="highlight-item">
              <span class="highlight-icon" aria-hidden="true">⏱️</span>
              <div>
                <div class="highlight-title">Log sessions effortlessly</div>
                <p class="highlight-copy">
                  Use the timer or quick-entry form to record start, end, and feeding amounts in
                  seconds.
                </p>
              </div>
            </li>
            <li class="highlight-item">
              <span class="highlight-icon" aria-hidden="true">🔔</span>
              <div>
                <div class="highlight-title">Stay ahead of the next feed</div>
                <p class="highlight-copy">
                  We calculate the next feeding window automatically and can remind you when it is
                  coming up.
                </p>
              </div>
            </li>
            <li class="highlight-item">
              <span class="highlight-icon" aria-hidden="true">📈</span>
              <div>
                <div class="highlight-title">Spot patterns quickly</div>
                <p class="highlight-copy">
                  Summaries highlight daily totals so you can share updates with caregivers or your
                  pediatrician.
                </p>
              </div>
            </li>
          </ul>
          <div>
            <button class="empty-state-action" type="button" @click=${this.handleEmptyStateAction}>
              Start a feeding
            </button>
          </div>
          <p class="empty-state-footer">You can fine-tune reminders anytime from Settings.</p>
        </div>
      `;
    }

    return html`
      <div class="log-list">
        ${this.logs.map(
          (log) => html`
            <div class="log-item" @click=${() => this.handleLogClick(log)}>
              <div class="log-header">
                <div class="log-type">
                  ${log.feedType === 'formula' ? '🍼 Formula' : '🤱 Breast Milk'}
                </div>
                <div style="display: flex; align-items: center; gap: 1rem;">
                  <div class="log-time">${this.formatTimeRange(log)}</div>
                  <button
                    class="delete-btn"
                    @click=${(e: Event) => this.handleDeleteClick(e, log)}
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
          `
        )}
      </div>
    `;
  }
}
