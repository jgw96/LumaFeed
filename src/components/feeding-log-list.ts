import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { FeedingLog } from '../types/feeding-log.js';

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
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 1.25rem;
      transition: box-shadow 0.2s;
    }

    .log-item:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .log-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .log-type {
      font-weight: 600;
      color: #0066cc;
      font-size: 1.125rem;
    }

    .log-time {
      color: #666;
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
      color: #666;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.25rem;
    }

    .detail-value {
      color: #333;
      font-weight: 500;
      font-size: 1rem;
    }

    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      color: #666;
    }

    .empty-state-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .delete-btn {
      background: none;
      border: none;
      color: #dc3545;
      cursor: pointer;
      padding: 0.5rem;
      font-size: 1.125rem;
      transition: opacity 0.2s;
    }

    .delete-btn:hover {
      opacity: 0.7;
    }
  `;

  @property({ type: Array })
  logs: FeedingLog[] = [];

  private formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    const timeStr = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    
    if (isToday) {
      return `Today at ${timeStr}`;
    }
    
    const dateStr = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    
    return `${dateStr} at ${timeStr}`;
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
                <div class="log-time">${this.formatTimestamp(log.timestamp)}</div>
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
                <div class="detail-value">${log.isBottleFed ? 'Bottle' : 'Other'}</div>
              </div>
            </div>
          </div>
        `)}
      </div>
    `;
  }
}
