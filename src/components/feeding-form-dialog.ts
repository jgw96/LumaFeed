import { LitElement, html, css } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import type { FeedingLog, UnitType } from '../types/feeding-log.js';

@customElement('feeding-form-dialog')
export class FeedingFormDialog extends LitElement {
  static styles = css`
    dialog {
      border: none;
      border-radius: var(--md-sys-shape-corner-extra-large);
      padding: 0;
      max-width: 560px;
      width: 90vw;
      background: var(--md-sys-color-surface-container-high);
      color: var(--md-sys-color-on-surface);
      box-shadow: var(--md-sys-elevation-3);
    }

    dialog::backdrop {
      background: rgba(0, 0, 0, 0.32);
    }

    .dialog-header {
      background: var(--md-sys-color-surface);
      color: var(--md-sys-color-on-surface);
      padding: 1.5rem;
      border-radius: var(--md-sys-shape-corner-extra-large) var(--md-sys-shape-corner-extra-large) 0 0;
    }

    .dialog-header h2 {
      margin: 0;
      font-size: var(--md-sys-typescale-headline-large-font-size);
      font-weight: var(--md-sys-typescale-headline-large-font-weight);
      line-height: var(--md-sys-typescale-headline-large-line-height);
    }

    .dialog-content {
      padding: 1.5rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: var(--md-sys-color-on-surface);
      font-size: var(--md-sys-typescale-body-large-font-size);
    }

    input[type="number"],
    select {
      width: 100%;
      padding: 0.875rem 1rem;
      border: 1px solid var(--md-sys-color-outline);
      border-radius: var(--md-sys-shape-corner-extra-small);
      font-size: var(--md-sys-typescale-body-large-font-size);
      font-family: inherit;
      background: var(--md-sys-color-surface-container-lowest);
      color: var(--md-sys-color-on-surface);
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    input[type="number"]:focus,
    select:focus {
      outline: none;
      border-color: var(--md-sys-color-primary);
      box-shadow: 0 0 0 2px var(--md-sys-color-primary-container);
    }

    .radio-group {
      display: flex;
      gap: 1.5rem;
    }

    .radio-option {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    input[type="radio"] {
      width: 20px;
      height: 20px;
      cursor: pointer;
      accent-color: var(--md-sys-color-primary);
    }

    .amount-group {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 0.75rem;
    }

    .dialog-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
      padding: 1.5rem;
      border-top: 1px solid var(--md-sys-color-outline-variant);
    }

    button {
      padding: 0.625rem 1.5rem;
      border: none;
      border-radius: var(--md-sys-shape-corner-extra-large);
      font-size: var(--md-sys-typescale-label-large-font-size);
      font-weight: var(--md-sys-typescale-label-large-font-weight);
      cursor: pointer;
      transition: background-color 0.2s, box-shadow 0.2s;
      min-height: 40px;
    }

    .btn-cancel {
      background: transparent;
      color: var(--md-sys-color-primary);
    }

    .btn-cancel:hover {
      background: var(--md-sys-color-primary-container);
    }

    .btn-save {
      background: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-primary);
      box-shadow: var(--md-sys-elevation-1);
    }

    .btn-save:hover {
      background: var(--md-sys-color-primary-container);
      color: var(--md-sys-color-on-primary-container);
      box-shadow: var(--md-sys-elevation-2);
    }

    .btn-save:active {
      box-shadow: var(--md-sys-elevation-1);
    }

    .btn-save:disabled {
      background: var(--md-sys-color-surface-variant);
      color: var(--md-sys-color-on-surface-variant);
      cursor: not-allowed;
      box-shadow: none;
      opacity: 0.38;
    }
  `;

  @query('dialog')
  dialog!: HTMLDialogElement;

  @state()
  private feedType: 'formula' | 'milk' = 'formula';

  @state()
  private amount: number = 0;

  @state()
  private unit: UnitType = 'ml';

  @state()
  private duration: number = 0;

  @state()
  private isBottleFed: boolean = true;

  open() {
    this.dialog.showModal();
  }

  close() {
    this.dialog.close();
    this.resetForm();
  }

  private resetForm() {
    this.feedType = 'formula';
    this.amount = 0;
    this.unit = 'ml';
    this.duration = 0;
    this.isBottleFed = true;
  }

  private handleSubmit(e: Event) {
    e.preventDefault();

    // Convert amount to both ml and oz
    const amountMl = this.unit === 'ml' ? this.amount : this.amount * 29.5735;
    const amountOz = this.unit === 'oz' ? this.amount : this.amount / 29.5735;

    const log: FeedingLog = {
      id: crypto.randomUUID(),
      feedType: this.feedType,
      amountMl: Math.round(amountMl * 10) / 10,
      amountOz: Math.round(amountOz * 10) / 10,
      durationMinutes: this.duration,
      isBottleFed: this.isBottleFed,
      timestamp: Date.now(),
    };

    this.dispatchEvent(new CustomEvent('log-added', { 
      detail: log,
      bubbles: true,
      composed: true 
    }));

    this.close();
  }

  private handleCancel() {
    this.close();
  }

  private get isValid(): boolean {
    return this.amount > 0 && this.duration > 0;
  }

  render() {
    return html`
      <dialog>
        <div class="dialog-header">
          <h2>Add Feeding Log</h2>
        </div>
        
        <form @submit=${this.handleSubmit}>
          <div class="dialog-content">
            <div class="form-group">
              <label>Feed Type</label>
              <div class="radio-group">
                <div class="radio-option">
                  <input
                    type="radio"
                    id="formula"
                    name="feedType"
                    value="formula"
                    .checked=${this.feedType === 'formula'}
                    @change=${() => this.feedType = 'formula'}
                  />
                  <label for="formula">Formula</label>
                </div>
                <div class="radio-option">
                  <input
                    type="radio"
                    id="milk"
                    name="feedType"
                    value="milk"
                    .checked=${this.feedType === 'milk'}
                    @change=${() => this.feedType = 'milk'}
                  />
                  <label for="milk">Breast Milk</label>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label for="amount">Amount</label>
              <div class="amount-group">
                <input
                  type="number"
                  id="amount"
                  min="0"
                  step="0.1"
                  .value=${this.amount.toString()}
                  @input=${(e: Event) => this.amount = parseFloat((e.target as HTMLInputElement).value) || 0}
                  required
                />
                <select
                  @change=${(e: Event) => this.unit = (e.target as HTMLSelectElement).value as UnitType}
                  .value=${this.unit}
                >
                  <option value="ml">ml</option>
                  <option value="oz">fl oz</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label for="duration">Duration (minutes)</label>
              <input
                type="number"
                id="duration"
                min="0"
                step="1"
                .value=${this.duration.toString()}
                @input=${(e: Event) => this.duration = parseInt((e.target as HTMLInputElement).value) || 0}
                required
              />
            </div>

            <div class="form-group">
              <label>Feeding Method</label>
              <div class="radio-group">
                <div class="radio-option">
                  <input
                    type="radio"
                    id="bottle"
                    name="feedingMethod"
                    .checked=${this.isBottleFed}
                    @change=${() => this.isBottleFed = true}
                  />
                  <label for="bottle">Bottle</label>
                </div>
                <div class="radio-option">
                  <input
                    type="radio"
                    id="other"
                    name="feedingMethod"
                    .checked=${!this.isBottleFed}
                    @change=${() => this.isBottleFed = false}
                  />
                  <label for="other">Other</label>
                </div>
              </div>
            </div>
          </div>

          <div class="dialog-actions">
            <button type="button" class="btn-cancel" @click=${this.handleCancel}>
              Cancel
            </button>
            <button type="submit" class="btn-save" ?disabled=${!this.isValid}>
              Save Log
            </button>
          </div>
        </form>
      </dialog>
    `;
  }
}
