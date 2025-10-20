import { html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import type { DiaperLog, StoolColor, StoolConsistency } from '../types/diaper-log.js';
import { BaseModalDialog } from './base-modal-dialog.js';
import { dialogCancelButtonStyles, dialogHeaderStyles } from './dialog-shared-styles.js';

function getLocalDateTimeInputValue(date: Date = new Date()): string {
  const clone = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return clone.toISOString().slice(0, 16);
}

function parseDateTimeInput(value: string): number | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  const timestamp = parsed.getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

@customElement('diaper-form-dialog')
export class DiaperFormDialog extends BaseModalDialog {
  static styles = [
    dialogHeaderStyles,
    dialogCancelButtonStyles,
    css`
      dialog {
        border: none;
        border-radius: var(--md-sys-shape-corner-extra-large);
        padding: 0;
        width: min(520px, calc(100vw - 2rem));
        margin: auto;
        background: var(--md-sys-color-surface-container-high);
        color: var(--md-sys-color-on-surface);
        box-shadow: var(--md-sys-elevation-3);
        opacity: 0;
        transform: translateY(-12px);
        box-sizing: border-box;
        max-height: calc(100vh - 2rem);
        overflow: auto;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
      }

      dialog::backdrop {
        background: rgba(0, 0, 0, 0.32);
        backdrop-filter: blur(24px);
      }

      dialog[open] {
        animation: fade-in 0.2s ease forwards;
      }

      dialog.closing {
        animation: fade-out 0.2s ease forwards;
      }

      @keyframes fade-in {
        from {
          opacity: 0;
          transform: translateY(8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes fade-out {
        from {
          opacity: 1;
          transform: translateY(0);
        }
        to {
          opacity: 0;
          transform: translateY(6px);
        }
      }

      form {
        display: grid;
        gap: 0;
      }

      .dialog-content {
        padding: 1.5rem;
        display: grid;
        gap: 1.25rem;
      }

      fieldset {
        margin: 0;
        padding: 0;
        border: none;
        display: grid;
        gap: 0.75rem;
      }

      legend {
        font-weight: 600;
        color: var(--md-sys-color-on-surface);
        margin-bottom: 0.5rem;
        font-size: var(--md-sys-typescale-title-small-font-size);
      }

      .input-group {
        display: grid;
        gap: 0.5rem;
      }

      label {
        display: grid;
        gap: 0.35rem;
        color: var(--md-sys-color-on-surface);
        font-size: var(--md-sys-typescale-label-large-font-size);
        font-weight: 500;
      }

      input[type='datetime-local'],
      select,
      textarea {
        padding: 0.75rem 1rem;
        border-radius: var(--md-sys-shape-corner-medium);
        border: 1px solid var(--md-sys-color-outline-variant);
        background: var(--md-sys-color-surface-container-low);
        color: var(--md-sys-color-on-surface);
        font: inherit;
        resize: none;
        min-height: 48px;
      }

      textarea {
        min-height: 90px;
      }

      input[type='checkbox'] {
        width: 18px;
        height: 18px;
      }

      .option-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        border-radius: var(--md-sys-shape-corner-medium);
        border: 1px solid var(--md-sys-color-outline-variant);
        background: var(--md-sys-color-surface-container-low);
        cursor: pointer;
      }

      .option-row input {
        cursor: pointer;
      }

      .option-row span {
        font-weight: 500;
        color: var(--md-sys-color-on-surface);
      }

      .supporting-text {
        color: var(--md-sys-color-on-surface-variant);
        font-size: var(--md-sys-typescale-body-small-font-size);
        line-height: var(--md-sys-typescale-body-small-line-height);
      }

      .inline-fields {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 0.75rem;
      }

      .dialog-actions {
        padding: 1.25rem 1.5rem;
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        border-top: 1px solid var(--md-sys-color-outline-variant);
        background: var(--md-sys-color-surface);
        border-radius: 0 0 var(--md-sys-shape-corner-extra-large)
          var(--md-sys-shape-corner-extra-large);
      }

      button {
        min-height: var(--md-comp-button-height);
        padding: 0 var(--md-comp-button-horizontal-padding);
        border-radius: var(--md-comp-button-shape);
        border: none;
        cursor: pointer;
        font-weight: var(--md-sys-typescale-label-large-font-weight);
        font-size: var(--md-sys-typescale-label-large-font-size);
      }

      .button-filled {
        background: var(--md-sys-color-primary);
        color: var(--md-sys-color-on-primary);
      }

      .error-message {
        color: var(--md-sys-color-error);
        background: color-mix(in srgb, var(--md-sys-color-error) 12%, transparent);
        border: 1px solid color-mix(in srgb, var(--md-sys-color-error) 45%, transparent);
        border-radius: var(--md-sys-shape-corner-medium);
        padding: 0.75rem 1rem;
        font-size: var(--md-sys-typescale-body-small-font-size);
        line-height: 1.4;
      }

      .checkbox-grid {
        display: grid;
        gap: 0.5rem;
      }
    `,
  ];

  @state()
  private wet = true;

  @state()
  private dirty = false;

  @state()
  private stoolColor: StoolColor = null;

  @state()
  private stoolConsistency: StoolConsistency = null;

  @state()
  private containsMucus = false;

  @state()
  private containsBlood = false;

  @state()
  private notes = '';

  @state()
  private dateTimeValue = getLocalDateTimeInputValue();

  @state()
  private errorMessage: string | null = null;

  protected get enableScrollLock(): boolean {
    return true;
  }

  protected resetDialogState(): void {
    this.wet = true;
    this.dirty = false;
    this.stoolColor = null;
    this.stoolConsistency = null;
    this.containsMucus = false;
    this.containsBlood = false;
    this.notes = '';
    this.dateTimeValue = getLocalDateTimeInputValue();
    this.errorMessage = null;
  }

  private handleCancel = () => {
    this.close();
  };

  private handleSubmit = (event: Event) => {
    event.preventDefault();

    if (!this.wet && !this.dirty) {
      this.errorMessage = 'Select whether this diaper was wet, dirty, or both.';
      return;
    }

    const timestamp = parseDateTimeInput(this.dateTimeValue);
    if (timestamp === null) {
      this.errorMessage = 'Choose the time of the diaper change.';
      return;
    }

    const log: DiaperLog = {
      id: crypto.randomUUID(),
      timestamp,
      wet: this.wet,
      dirty: this.dirty,
      stoolColor: this.dirty ? this.stoolColor : null,
      stoolConsistency: this.dirty ? this.stoolConsistency : null,
      containsMucus: this.dirty ? this.containsMucus : false,
      containsBlood: this.dirty ? this.containsBlood : false,
      notes: this.notes.trim(),
    };

    this.dispatchEvent(
      new CustomEvent<DiaperLog>('log-added', {
        detail: log,
        bubbles: true,
        composed: true,
      })
    );

    this.close();
  };

  private handleWetChange(event: Event) {
    const target = event.currentTarget as HTMLInputElement;
    this.wet = target.checked;
    this.errorMessage = null;
  }

  private handleDirtyChange(event: Event) {
    const target = event.currentTarget as HTMLInputElement;
    this.dirty = target.checked;

    if (!target.checked) {
      this.stoolColor = null;
      this.stoolConsistency = null;
      this.containsBlood = false;
      this.containsMucus = false;
    }

    this.errorMessage = null;
  }

  private handleInputChange(event: Event) {
    const target = event.currentTarget as
      | HTMLInputElement
      | HTMLTextAreaElement
      | HTMLSelectElement;
    const { name, value, type } = target;

    switch (name) {
      case 'timestamp':
        this.dateTimeValue = value;
        break;
      case 'stoolColor':
        this.stoolColor = value ? (value as StoolColor) : null;
        break;
      case 'stoolConsistency':
        this.stoolConsistency = value ? (value as StoolConsistency) : null;
        break;
      case 'notes':
        this.notes = value;
        break;
      case 'containsMucus':
        this.containsMucus = type === 'checkbox' ? (target as HTMLInputElement).checked : false;
        break;
      case 'containsBlood':
        this.containsBlood = type === 'checkbox' ? (target as HTMLInputElement).checked : false;
        break;
      default:
        break;
    }

    this.errorMessage = null;
  }

  private renderStoolOptions() {
    if (!this.dirty) {
      return null;
    }

    return html`
      <fieldset>
        <legend>Stool observations</legend>
        <div class="inline-fields">
          <label>
            Color
            <select
              name="stoolColor"
              @change=${this.handleInputChange}
              .value=${this.stoolColor ?? ''}
            >
              <option value="">Select</option>
              <option value="yellow">Yellow</option>
              <option value="green">Green</option>
              <option value="brown">Brown</option>
              <option value="black">Black (meconium)</option>
              <option value="red">Red</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label>
            Consistency
            <select
              name="stoolConsistency"
              @change=${this.handleInputChange}
              .value=${this.stoolConsistency ?? ''}
            >
              <option value="">Select</option>
              <option value="watery">Watery</option>
              <option value="seedy">Seedy</option>
              <option value="soft">Soft</option>
              <option value="pasty">Pasty</option>
              <option value="formed">Formed</option>
              <option value="mucousy">Mucousy</option>
            </select>
          </label>
        </div>
        <div class="checkbox-grid">
          <label class="option-row">
            <input
              type="checkbox"
              name="containsMucus"
              .checked=${this.containsMucus}
              @change=${this.handleInputChange}
            />
            <span>Mucus present</span>
          </label>
          <label class="option-row">
            <input
              type="checkbox"
              name="containsBlood"
              .checked=${this.containsBlood}
              @change=${this.handleInputChange}
            />
            <span>Specks of blood</span>
          </label>
        </div>
      </fieldset>
    `;
  }

  render() {
    return html`
      <dialog @cancel=${this.handleCancel}>
        <form method="dialog" @submit=${this.handleSubmit} novalidate>
          <div class="dialog-header">
            <h2>Log a diaper</h2>
            <p>
              Track wet and dirty diapers so you always have the details your pediatrician asks.
            </p>
          </div>
          <div class="dialog-content">
            <div class="input-group">
              <label>
                When did this diaper happen?
                <input
                  type="datetime-local"
                  name="timestamp"
                  required
                  .value=${this.dateTimeValue}
                  @change=${this.handleInputChange}
                />
              </label>
            </div>

            <fieldset>
              <legend>Diaper type</legend>
              <label class="option-row">
                <input type="checkbox" .checked=${this.wet} @change=${this.handleWetChange} />
                <span>Pee diaper</span>
              </label>
              <p class="supporting-text">
                Pee diapers help your pediatrician confirm hydration. Count every wet diaper you
                change.
              </p>

              <label class="option-row">
                <input type="checkbox" .checked=${this.dirty} @change=${this.handleDirtyChange} />
                <span>Poop diaper</span>
              </label>
              <p class="supporting-text">
                For dirty diapers, include color and consistency to monitor digestion and potential
                sensitivities.
              </p>
            </fieldset>

            ${this.renderStoolOptions()}

            <div class="input-group">
              <label>
                Notes (optional)
                <textarea
                  name="notes"
                  rows="3"
                  placeholder="Anything unusual about this diaper?"
                  .value=${this.notes}
                  @input=${this.handleInputChange}
                ></textarea>
              </label>
            </div>

            ${this.errorMessage
              ? html`<div class="error-message" role="alert">${this.errorMessage}</div>`
              : null}
          </div>
          <div class="dialog-actions">
            <button type="button" class="dialog-cancel-button" @click=${this.handleCancel}>
              Cancel
            </button>
            <button type="submit" class="button-filled">Save diaper</button>
          </div>
        </form>
      </dialog>
    `;
  }
}
