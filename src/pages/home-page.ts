import { LitElement, html, css } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import type { FeedingLog } from '../types/feeding-log.js';
import { feedingStorage } from '../services/feeding-storage.js';
import '../components/feeding-form-dialog.js';
import '../components/feeding-log-list.js';
import type { FeedingFormDialog } from '../components/feeding-form-dialog.js';

@customElement('home-page')
export class HomePage extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 2rem;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    h1 {
      color: #333;
      margin: 0;
    }

    .add-btn {
      background: #0066cc;
      color: white;
      border: none;
      padding: 0.875rem 1.75rem;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .add-btn:hover {
      background: #0052a3;
    }

    .add-btn::before {
      content: '+';
      font-size: 1.5rem;
      line-height: 1;
    }

    .logs-section {
      margin-top: 2rem;
    }

    .section-title {
      color: #333;
      font-size: 1.125rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }

    .loading {
      text-align: center;
      padding: 2rem;
      color: #666;
    }
  `;

  @state()
  private logs: FeedingLog[] = [];

  @state()
  private loading: boolean = true;

  @query('feeding-form-dialog')
  private dialog!: FeedingFormDialog;

  async connectedCallback() {
    super.connectedCallback();
    await this.loadLogs();
  }

  private async loadLogs() {
    this.loading = true;
    try {
      this.logs = await feedingStorage.loadLogs();
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      this.loading = false;
    }
  }

  private handleAddClick() {
    this.dialog.open();
  }

  private async handleLogAdded(e: CustomEvent<FeedingLog>) {
    try {
      await feedingStorage.addLog(e.detail);
      await this.loadLogs();
    } catch (error) {
      console.error('Failed to save log:', error);
    }
  }

  private async handleLogDeleted(e: CustomEvent<string>) {
    try {
      await feedingStorage.deleteLog(e.detail);
      await this.loadLogs();
    } catch (error) {
      console.error('Failed to delete log:', error);
    }
  }

  render() {
    return html`
      <div class="container">
        <div class="header">
          <h1>Feeding Tracker</h1>
          <button class="add-btn" @click=${this.handleAddClick}>
            Add Feeding
          </button>
        </div>

        <div class="logs-section">
          <h2 class="section-title">Recent Feedings</h2>
          ${this.loading 
            ? html`<div class="loading">Loading...</div>`
            : html`
                <feeding-log-list 
                  .logs=${this.logs}
                  @log-deleted=${this.handleLogDeleted}
                ></feeding-log-list>
              `
          }
        </div>

        <feeding-form-dialog @log-added=${this.handleLogAdded}></feeding-form-dialog>
      </div>
    `;
  }
}
