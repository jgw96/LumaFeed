import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { type FeedingLog, type UnitType } from '../types/feeding-log.js';
import { feedingStorage } from '../services/feeding-storage.js';

@customElement('log-detail-page')
export class LogDetailPage extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 1.5rem;
      background-color: var(--md-sys-color-background);
      min-height: calc(100vh - var(--header-height, 80px));
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
    }

    .loading-state,
    .error-state {
      text-align: center;
      padding: 3rem 1.5rem;
      color: var(--md-sys-color-on-surface);
    }

    .error-state {
      color: var(--md-sys-color-error);
    }

    .detail-card {
      background: var(--md-sys-color-surface-container-low);
      border: 1px solid var(--md-sys-color-outline-variant);
      border-radius: var(--md-sys-shape-corner-extra-large);
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--md-sys-color-outline-variant);
    }

    .log-type {
      font-size: var(--md-sys-typescale-headline-medium-font-size);
      font-weight: var(--md-sys-typescale-headline-medium-font-weight);
      color: var(--md-sys-color-primary);
    }

    .form-section {
      display: grid;
      gap: 1.5rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    label {
      color: var(--md-sys-color-on-surface-variant);
      font-size: var(--md-sys-typescale-label-large-font-size);
      font-weight: var(--md-sys-typescale-label-large-font-weight);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    input[type='datetime-local'],
    input[type='number'],
    select {
      padding: 0.75rem 1rem;
      border: 1px solid var(--md-sys-color-outline);
      border-radius: var(--md-sys-shape-corner-medium);
      background: var(--md-sys-color-surface);
      color: var(--md-sys-color-on-surface);
      font-size: var(--md-sys-typescale-body-large-font-size);
      font-family: inherit;
      transition: border-color 0.2s;
    }

    input:focus,
    select:focus {
      outline: none;
      border-color: var(--md-sys-color-primary);
      box-shadow: 0 0 0 2px var(--md-sys-color-primary-container);
    }

    .button-group {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 1.5rem;
    }

    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      min-height: 40px;
      padding: 0 1.5rem;
      border: none;
      border-radius: var(--md-sys-shape-corner-full);
      font-weight: 600;
      font-size: var(--md-sys-typescale-label-large-font-size);
      cursor: pointer;
      transition:
        background-color 0.2s,
        box-shadow 0.2s;
    }

    .btn-primary {
      background: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-primary);
      box-shadow: var(--md-sys-elevation-1);
    }

    .btn-primary:hover,
    .btn-primary:focus-visible {
      background: var(--md-sys-color-primary-container);
      color: var(--md-sys-color-on-primary-container);
      box-shadow: var(--md-sys-elevation-2);
      outline: none;
    }

    .btn-secondary {
      background: var(--md-sys-color-surface-container-high);
      color: var(--md-sys-color-on-surface);
      border: 1px solid var(--md-sys-color-outline);
    }

    .btn-secondary:hover,
    .btn-secondary:focus-visible {
      background: var(--md-sys-color-surface-container-highest);
      outline: none;
    }

    .btn-danger {
      background: var(--md-sys-color-error-container);
      color: var(--md-sys-color-on-error-container);
    }

    .btn-danger:hover,
    .btn-danger:focus-visible {
      background: var(--md-sys-color-error);
      color: var(--md-sys-color-on-error);
      outline: none;
    }

    .readonly-value {
      padding: 0.75rem 1rem;
      background: var(--md-sys-color-surface-variant);
      border-radius: var(--md-sys-shape-corner-medium);
      color: var(--md-sys-color-on-surface-variant);
      font-size: var(--md-sys-typescale-body-large-font-size);
    }
  `;

  @state()
  private log: FeedingLog | null = null;

  @state()
  private loading = true;

  @state()
  private error: string | null = null;

  @state()
  private logId: string | null = null;

  // Form state
  @state()
  private feedType: 'formula' | 'milk' = 'formula';

  @state()
  private amountValue = '';

  @state()
  private amountUnit: UnitType = 'ml';

  @state()
  private isBottleFed = true;

  @state()
  private startTime = '';

  @state()
  private endTime = '';

  connectedCallback() {
    super.connectedCallback();
    this.loadLog();
  }

  private async loadLog() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
      this.error = 'No log ID provided';
      this.loading = false;
      return;
    }

    this.logId = id;

    try {
      const log = await feedingStorage.getLog(id);
      if (!log) {
        this.error = 'Log not found';
        this.loading = false;
        return;
      }

      this.log = log;
      this.populateForm(log);
      this.loading = false;
    } catch (err) {
      console.error('Error loading log:', err);
      this.error = 'Failed to load log';
      this.loading = false;
    }
  }

  private populateForm(log: FeedingLog) {
    this.feedType = log.feedType;
    this.isBottleFed = log.isBottleFed;
    this.amountUnit = 'ml';
    this.amountValue = String(log.amountMl);

    // Convert timestamps to datetime-local format
    const startDate = new Date(log.startTime);
    const endDate = new Date(log.endTime);

    this.startTime = this.formatDateTimeLocal(startDate);
    this.endTime = this.formatDateTimeLocal(endDate);
  }

  private formatDateTimeLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  private handleAmountChange(e: Event) {
    const input = e.target as HTMLInputElement;
    this.amountValue = input.value;
  }

  private handleUnitChange(e: Event) {
    const select = e.target as HTMLSelectElement;
    this.amountUnit = select.value as UnitType;
  }

  private handleFeedTypeChange(e: Event) {
    const select = e.target as HTMLSelectElement;
    this.feedType = select.value as 'formula' | 'milk';
  }

  private handleBottleFedChange(e: Event) {
    const select = e.target as HTMLSelectElement;
    this.isBottleFed = select.value === 'true';
  }

  private handleStartTimeChange(e: Event) {
    const input = e.target as HTMLInputElement;
    this.startTime = input.value;
  }

  private handleEndTimeChange(e: Event) {
    const input = e.target as HTMLInputElement;
    this.endTime = input.value;
  }

  private async handleSave() {
    if (!this.log || !this.logId) return;

    try {
      const amountNum = parseFloat(this.amountValue);
      if (isNaN(amountNum) || amountNum <= 0) {
        alert('Please enter a valid amount');
        return;
      }

      const startDate = new Date(this.startTime);
      const endDate = new Date(this.endTime);

      if (startDate >= endDate) {
        alert('End time must be after start time');
        return;
      }

      const durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / 60000);

      // Convert amount to both ml and oz
      let amountMl: number;
      let amountOz: number;

      if (this.amountUnit === 'ml') {
        amountMl = amountNum;
        amountOz = Math.round((amountNum / 29.5735) * 10) / 10;
      } else {
        amountOz = amountNum;
        amountMl = Math.round(amountNum * 29.5735);
      }

      const updatedLog: FeedingLog = {
        ...this.log,
        feedType: this.feedType,
        amountMl,
        amountOz,
        isBottleFed: this.isBottleFed,
        startTime: startDate.getTime(),
        endTime: endDate.getTime(),
        timestamp: endDate.getTime(),
        durationMinutes,
      };

      await feedingStorage.updateLog(updatedLog);

      // Navigate back to home
      window.history.back();
    } catch (err) {
      console.error('Error saving log:', err);
      alert('Failed to save log');
    }
  }

  private handleCancel() {
    window.history.back();
  }

  private async handleDelete() {
    if (!this.logId) return;

    if (
      !confirm(
        'Are you sure you want to delete this feeding log? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      await feedingStorage.deleteLog(this.logId);
      window.history.back();
    } catch (err) {
      console.error('Error deleting log:', err);
      alert('Failed to delete log');
    }
  }

  private calculateDuration(): string {
    if (!this.startTime || !this.endTime) return '0';
    const start = new Date(this.startTime);
    const end = new Date(this.endTime);
    const duration = Math.round((end.getTime() - start.getTime()) / 60000);
    return duration > 0 ? String(duration) : '0';
  }

  render() {
    if (this.loading) {
      return html`
        <div class="container">
          <div class="loading-state">Loading...</div>
        </div>
      `;
    }

    if (this.error || !this.log) {
      return html`
        <div class="container">
          <div class="error-state">${this.error || 'Log not found'}</div>
          <div style="text-align: center; margin-top: 1rem;">
            <button class="btn-secondary" @click=${this.handleCancel}>Go Back</button>
          </div>
        </div>
      `;
    }

    return html`
      <div class="container">
        <div class="detail-card">
          <div class="detail-header">
            <div class="log-type">
              ${this.feedType === 'formula' ? '🍼 Formula' : '🤱 Breast Milk'}
            </div>
          </div>

          <form class="form-section" @submit=${(e: Event) => e.preventDefault()}>
            <div class="form-group">
              <label for="feed-type">Feed Type</label>
              <select
                id="feed-type"
                .value=${this.feedType}
                @change=${this.handleFeedTypeChange}
              >
                <option value="formula">Formula</option>
                <option value="milk">Breast Milk</option>
              </select>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="amount">Amount</label>
                <input
                  id="amount"
                  type="number"
                  step="0.1"
                  min="0"
                  .value=${this.amountValue}
                  @input=${this.handleAmountChange}
                  required
                />
              </div>

              <div class="form-group">
                <label for="unit">Unit</label>
                <select id="unit" .value=${this.amountUnit} @change=${this.handleUnitChange}>
                  <option value="ml">ml</option>
                  <option value="oz">fl oz</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label for="method">Method</label>
              <select
                id="method"
                .value=${this.isBottleFed ? 'true' : 'false'}
                @change=${this.handleBottleFedChange}
              >
                <option value="true">Bottle</option>
                <option value="false">Breast</option>
              </select>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="start-time">Start Time</label>
                <input
                  id="start-time"
                  type="datetime-local"
                  .value=${this.startTime}
                  @input=${this.handleStartTimeChange}
                  required
                />
              </div>

              <div class="form-group">
                <label for="end-time">End Time</label>
                <input
                  id="end-time"
                  type="datetime-local"
                  .value=${this.endTime}
                  @input=${this.handleEndTimeChange}
                  required
                />
              </div>
            </div>

            <div class="form-group">
              <label>Duration</label>
              <div class="readonly-value">${this.calculateDuration()} minutes</div>
            </div>

            <div class="button-group">
              <button class="btn-danger" type="button" @click=${this.handleDelete}>
                Delete
              </button>
              <button class="btn-secondary" type="button" @click=${this.handleCancel}>
                Cancel
              </button>
              <button class="btn-primary" type="button" @click=${this.handleSave}>
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }
}
