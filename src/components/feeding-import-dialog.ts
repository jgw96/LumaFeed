import { LitElement, html, css } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { calculateNextFeedTime, type FeedingLog, type UnitType } from '../types/feeding-log.js';
import { settingsService } from '../services/settings-service.js';
import { acquireScrollLock, releaseScrollLock } from '../utils/dialog-scroll-lock.js';

const ML_PER_FL_OZ = 29.5735;
const DEFAULT_DURATION_MINUTES = 20;

type FeedMethod = 'bottle' | 'breast';

interface ImportEntry {
  id: string;
  feedType: FeedingLog['feedType'];
  method: FeedMethod;
  amount: string;
  unit: UnitType;
  start: string;
  end: string;
}

type FieldName = 'start' | 'end' | 'amount';

interface NormalizedEntry {
  entry: ImportEntry;
  startTime: number;
  endTime: number;
  durationMinutes: number;
  amountMl: number;
  amountOz: number;
  isBottleFed: boolean;
}

@customElement('feeding-import-dialog')
export class FeedingImportDialog extends LitElement {
  static styles = css`
    dialog {
      border: none;
      border-radius: var(--md-sys-shape-corner-extra-large);
      padding: 0;
      max-width: 560px;
      width: 90vw;
      margin: auto;
      background: var(--md-sys-color-surface-container-high);
      color: var(--md-sys-color-on-surface);
      box-shadow: var(--md-sys-elevation-3);
      opacity: 0;
      transform: translateY(-12px);
      max-height: calc(100vh - 2rem);
      overflow: auto;
      overscroll-behavior: contain;
      -webkit-overflow-scrolling: touch;
      box-sizing: border-box;
    }

    dialog::backdrop {
      background: rgba(0, 0, 0, 0.32);
      backdrop-filter: blur(24px);
      opacity: 0;
    }

    dialog[open]:not(.closing) {
      animation: dialog-enter 200ms ease forwards;
    }

    dialog[open]:not(.closing)::backdrop {
      animation: backdrop-enter 200ms ease forwards;
    }

    dialog.closing {
      animation: dialog-exit 200ms ease forwards;
    }

    dialog.closing::backdrop {
      animation: backdrop-exit 200ms ease forwards;
    }

    form {
      display: grid;
      gap: 0;
    }

    .dialog-header {
      background: var(--md-sys-color-surface);
      color: var(--md-sys-color-on-surface);
      padding: 1.5rem;
      border-radius: var(--md-sys-shape-corner-extra-large) var(--md-sys-shape-corner-extra-large) 0
        0;
      display: grid;
      gap: 0.5rem;
    }

    .dialog-header h2 {
      margin: 0;
      font-size: var(--md-sys-typescale-headline-large-font-size);
      font-weight: var(--md-sys-typescale-headline-large-font-weight);
      line-height: var(--md-sys-typescale-headline-large-line-height);
    }

    .dialog-header .subtitle {
      margin: 0.5rem 0 0 0;
      color: var(--md-sys-color-on-surface-variant);
      font-size: var(--md-sys-typescale-body-medium-font-size);
      line-height: var(--md-sys-typescale-body-medium-line-height);
    }

    .dialog-content {
      display: grid;
      gap: 1.5rem;
      padding: 1.5rem;
    }

    .entries {
      display: grid;
      gap: 1rem;
    }

    .entry-card {
      display: grid;
      gap: 1rem;
      padding: 1.25rem 1.5rem;
      border-radius: var(--md-sys-shape-corner-large);
      background: var(--md-sys-color-surface-container-low);
      border: 1px solid var(--md-sys-color-outline-variant);
    }

    .entry-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }

    .entry-title {
      font-weight: 600;
      color: var(--md-sys-color-on-surface);
    }

    .remove-btn {
      background: none;
      border: none;
      color: var(--md-sys-color-error);
      cursor: pointer;
      font-size: 0.875rem;
      padding: 0.35rem 0.75rem;
      border-radius: var(--md-sys-shape-corner-small);
      transition: background-color 0.2s ease;
    }

    .remove-btn:hover,
    .remove-btn:focus-visible {
      background: var(--md-sys-color-error-container);
      color: var(--md-sys-color-on-error-container);
      outline: none;
    }

    .entry-grid {
      display: grid;
      gap: 1.25rem;
    }

    .form-label {
      display: block;
      margin-bottom: 0.5rem;
      font-size: var(--md-sys-typescale-label-large-font-size);
      font-weight: var(--md-sys-typescale-label-large-font-weight);
      color: var(--md-sys-color-on-surface);
    }

    input,
    select {
      width: 87%;
      border-radius: var(--md-sys-shape-corner-large);
      border: 1px solid var(--md-sys-color-outline-variant);
      background: var(--md-sys-color-surface-container-lowest);
      color: var(--md-sys-color-on-surface);
      font: inherit;
      padding: 0.75rem 1rem;
      transition:
        border-color 0.2s ease,
        box-shadow 0.2s ease;
    }

    input:focus-visible,
    select:focus-visible {
      outline: none;
      border-color: var(--md-sys-color-primary);
      box-shadow: 0 0 0 3px var(--md-sys-color-primary-container);
    }

    .amount-group {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 0.75rem;
      align-items: start;
    }

    .radio-group {
      display: flex;
      flex-wrap: wrap;
      gap: 1.5rem;
    }

    .radio-option {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--md-sys-color-on-surface);
    }

    .radio-option input {
      width: 20px;
      height: 20px;
      margin: 0;
      cursor: pointer;
    }

    .time-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 0.75rem;
    }

    .time-input {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .computed-duration {
      margin-top: 0.5rem;
      padding: 0.75rem 1rem;
      border-radius: var(--md-sys-shape-corner-large);
      background: var(--md-sys-color-surface-container-lowest);
      border: 1px solid var(--md-sys-color-outline-variant);
      font-weight: 500;
      color: var(--md-sys-color-on-surface);
    }

    .field-error {
      margin-top: 0.35rem;
      color: var(--md-sys-color-error);
      font-size: var(--md-sys-typescale-body-small-font-size);
    }

    .add-entry-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      align-self: flex-start;
      background: none;
      border: 1px dashed var(--md-sys-color-outline-variant);
      color: var(--md-sys-color-primary);
      padding: 0.6rem 1rem;
      border-radius: var(--md-sys-shape-corner-large);
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .add-entry-btn:hover,
    .add-entry-btn:focus-visible {
      background: var(--md-sys-color-primary-container);
      color: var(--md-sys-color-on-primary-container);
      outline: none;
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1.5rem;
      border-top: 1px solid var(--md-sys-color-outline-variant);
    }

    .text-btn,
    .primary-btn {
      border: none;
      border-radius: var(--md-sys-shape-corner-large);
      padding: 0.75rem 1.5rem;
      font: inherit;
      cursor: pointer;
      transition:
        background-color 0.2s ease,
        box-shadow 0.2s ease;
      min-width: 96px;
    }

    .text-btn {
      background: transparent;
      color: var(--md-sys-color-primary);
    }

    .text-btn:hover,
    .text-btn:focus-visible {
      background: var(--md-sys-color-primary-container);
      color: var(--md-sys-color-on-primary-container);
      outline: none;
    }

    .primary-btn {
      background: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-primary);
      box-shadow: var(--md-sys-elevation-1);
    }

    .primary-btn:hover,
    .primary-btn:focus-visible {
      background: var(--md-sys-color-primary-container);
      color: var(--md-sys-color-on-primary-container);
      outline: none;
      box-shadow: var(--md-sys-elevation-2);
    }

    .primary-btn:disabled {
      background: var(--md-sys-color-surface-variant);
      color: var(--md-sys-color-on-surface-variant);
      cursor: not-allowed;
      box-shadow: none;
    }

    .form-error {
      color: var(--md-sys-color-error);
      background: var(--md-sys-color-error-container);
      border-radius: var(--md-sys-shape-corner-large);
      padding: 0.75rem 1rem;
      font-size: var(--md-sys-typescale-body-small-font-size);
    }

    @keyframes dialog-enter {
      0% {
        opacity: 0;
        transform: translateY(-12px);
      }

      100% {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes dialog-exit {
      0% {
        opacity: 1;
        transform: translateY(0);
        display: block;
      }

      100% {
        opacity: 0;
        transform: translateY(-12px);
        display: none;
      }
    }

    @keyframes backdrop-enter {
      0% {
        opacity: 0;
      }

      100% {
        opacity: 1;
      }
    }

    @keyframes backdrop-exit {
      0% {
        opacity: 1;
      }

      100% {
        opacity: 0;
      }
    }

    @supports (transition-behavior: allow-discrete) {
      dialog {
        animation: none;
        transition:
          opacity 200ms ease,
          transform 200ms ease,
          overlay 200ms ease allow-discrete,
          display 200ms ease allow-discrete;
        opacity: 0;
        transform: translateY(-12px);
      }

      dialog::backdrop {
        animation: none;
        transition:
          opacity 200ms ease,
          background-color 200ms ease,
          overlay 200ms ease allow-discrete,
          display 200ms ease allow-discrete;
        opacity: 0;
      }

      dialog:open:not(.closing) {
        opacity: 1;
        transform: translateY(0);
      }

      dialog:open:not(.closing)::backdrop {
        opacity: 1;
      }

      dialog.closing {
        opacity: 0;
        transform: translateY(-12px);
      }

      dialog.closing::backdrop {
        opacity: 0;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      dialog,
      dialog::backdrop {
        animation: none !important;
        transition: none !important;
      }
    }
  `;

  @state()
  private entries: ImportEntry[] = [];

  @state()
  private errors: Record<string, Partial<Record<FieldName, string>>> = {};

  @state()
  private submitting = false;

  @state()
  private submissionError: string | null = null;

  @query('dialog')
  private dialog?: HTMLDialogElement;

  private isClosing = false;

  private closeTimeoutId: number | null = null;

  private animationEndHandler?: (event: AnimationEvent) => void;

  private transitionEndHandler?: (event: TransitionEvent) => void;

  private resetPending = false;
  private hasScrollLock = false;

  private lockScroll() {
    if (this.hasScrollLock) {
      return;
    }
    acquireScrollLock();
    this.hasScrollLock = true;
  }

  private unlockScroll() {
    if (!this.hasScrollLock) {
      return;
    }
    releaseScrollLock();
    this.hasScrollLock = false;
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.resetForm();
  }

  open() {
    const dialog = this.dialog;
    if (!dialog) {
      return;
    }

    this.cancelPendingClose();
    this.resetForm();
    this.lockScroll();

    if (!dialog.open) {
      dialog.showModal();
    }

    this.updateComplete
      .then(() => {
        this.focusInitialField();
      })
      .catch(() => {});
  }

  close() {
    const dialog = this.dialog;
    if (!dialog) {
      return;
    }

    if (!dialog.open) {
      dialog.classList.remove('closing');
      this.isClosing = false;
      this.unlockScroll();
      this.scheduleResetForm();
      return;
    }

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      dialog.classList.remove('closing');
      this.isClosing = false;
      dialog.close();
      this.unlockScroll();
      this.scheduleResetForm();
      return;
    }

    if (this.isClosing) {
      return;
    }

    this.isClosing = true;
    dialog.classList.add('closing');

    const finishClose = () => {
      if (!this.isClosing) {
        return;
      }

      this.isClosing = false;
      this.clearClosingHandlers();
      dialog.classList.remove('closing');
      if (dialog.open) {
        dialog.close();
      }
      this.unlockScroll();
      this.scheduleResetForm();
    };

    const onAnimationEnd = (event: AnimationEvent) => {
      if (event.target !== dialog) {
        return;
      }
      finishClose();
    };

    const onTransitionEnd = (event: TransitionEvent) => {
      if (event.target !== dialog) {
        return;
      }
      finishClose();
    };

    this.animationEndHandler = onAnimationEnd;
    this.transitionEndHandler = onTransitionEnd;

    dialog.addEventListener('animationend', onAnimationEnd);
    dialog.addEventListener('transitionend', onTransitionEnd);

    this.closeTimeoutId = window.setTimeout(() => {
      finishClose();
    }, 250);
  }

  disconnectedCallback(): void {
    this.clearClosingHandlers();
    this.unlockScroll();
    super.disconnectedCallback();
  }

  private handleCancel(event: Event) {
    event.preventDefault();
    this.close();
  }

  private resetForm() {
    this.entries = [this.createEntry()];
    this.errors = {};
    this.submitting = false;
    this.submissionError = null;
  }

  private scheduleResetForm() {
    if (this.resetPending) {
      return;
    }

    this.resetPending = true;
    queueMicrotask(() => {
      if (!this.resetPending) {
        return;
      }
      this.resetPending = false;
      this.resetForm();
    });
  }

  private createEntry(): ImportEntry {
    const start = this.getDefaultDateTime();
    return {
      id: crypto.randomUUID(),
      feedType: 'milk',
      method: 'bottle',
      amount: '',
      unit: 'ml',
      start,
      end: this.addMinutesToDateTime(start, DEFAULT_DURATION_MINUTES),
    };
  }

  private getDefaultDateTime(): string {
    return this.toLocalInputValue(new Date());
  }

  private addMinutesToDateTime(value: string, minutes: number): string {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    parsed.setMinutes(parsed.getMinutes() + minutes);
    return this.toLocalInputValue(parsed);
  }

  private toLocalInputValue(date: Date): string {
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60_000);
    return local.toISOString().slice(0, 16);
  }

  private focusInitialField() {
    const firstInput = this.renderRoot.querySelector<HTMLElement>('[data-initial-focus]');
    firstInput?.focus();
  }

  private clearClosingHandlers() {
    if (this.closeTimeoutId !== null) {
      window.clearTimeout(this.closeTimeoutId);
      this.closeTimeoutId = null;
    }

    const dialog = this.dialog;
    if (!dialog) {
      return;
    }

    if (this.animationEndHandler) {
      dialog.removeEventListener('animationend', this.animationEndHandler);
      this.animationEndHandler = undefined;
    }

    if (this.transitionEndHandler) {
      dialog.removeEventListener('transitionend', this.transitionEndHandler);
      this.transitionEndHandler = undefined;
    }
  }

  private cancelPendingClose() {
    this.clearClosingHandlers();
    this.isClosing = false;
    this.resetPending = false;
    if (this.dialog) {
      this.dialog.classList.remove('closing');
    }
  }

  private updateEntry(id: string, patch: Partial<ImportEntry>) {
    this.entries = this.entries.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry));
  }

  private clearFieldError(id: string, field: FieldName) {
    const entryErrors = this.errors[id];
    if (!entryErrors || entryErrors[field] === undefined) {
      return;
    }

    const { [field]: _removed, ...rest } = entryErrors;
    const nextErrors = { ...this.errors };

    if (Object.keys(rest).length > 0) {
      nextErrors[id] = rest;
    } else {
      delete nextErrors[id];
    }

    this.errors = nextErrors;
  }

  private handleAddEntry = () => {
    this.entries = [...this.entries, this.createEntry()];
  };

  private handleRemoveEntry(id: string) {
    if (this.entries.length === 1) {
      this.entries = [this.createEntry()];
      this.errors = {};
      return;
    }

    this.entries = this.entries.filter((entry) => entry.id !== id);
    const nextErrors = { ...this.errors };
    delete nextErrors[id];
    this.errors = nextErrors;
  }

  private handleStartChange(id: string, value: string) {
    this.updateEntry(id, { start: value });
    this.clearFieldError(id, 'start');
  }

  private handleEndChange(id: string, value: string) {
    this.updateEntry(id, { end: value });
    this.clearFieldError(id, 'end');
  }

  private handleAmountChange(id: string, value: string) {
    this.updateEntry(id, { amount: value });
    this.clearFieldError(id, 'amount');
  }

  private handleUnitChange(id: string, value: UnitType) {
    this.updateEntry(id, { unit: value });
  }

  private handleFeedTypeChange(id: string, value: FeedingLog['feedType']) {
    this.updateEntry(id, { feedType: value });
  }

  private handleMethodChange(id: string, value: FeedMethod) {
    this.updateEntry(id, { method: value });
  }

  private calculateDurationMinutes(entry: ImportEntry): number | null {
    const start = Number(new Date(entry.start));
    const end = Number(new Date(entry.end));

    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      return null;
    }

    const diff = Math.round((end - start) / 60_000);
    return diff > 0 ? diff : null;
  }

  private formatDuration(entry: ImportEntry): string {
    const minutes = this.calculateDurationMinutes(entry);
    return minutes !== null ? `${minutes} min` : '—';
  }

  private renderFieldError(entryId: string, field: FieldName) {
    const error = this.errors[entryId]?.[field];
    if (!error) {
      return null;
    }

    return html`<div class="field-error" role="alert">${error}</div>`;
  }

  private validateEntries(): { valid: boolean; normalized: NormalizedEntry[] } {
    const nextErrors: Record<string, Partial<Record<FieldName, string>>> = {};
    const normalized: NormalizedEntry[] = [];

    for (const entry of this.entries) {
      const entryErrors: Partial<Record<FieldName, string>> = {};

      const startTime = entry.start ? Number(new Date(entry.start)) : Number.NaN;
      if (!Number.isFinite(startTime)) {
        entryErrors.start = 'Enter a valid start time';
      }

      const endTime = entry.end ? Number(new Date(entry.end)) : Number.NaN;
      if (!Number.isFinite(endTime)) {
        entryErrors.end = 'Enter a valid end time';
      }

      let durationMinutes = Number.NaN;
      if (Number.isFinite(startTime) && Number.isFinite(endTime)) {
        durationMinutes = Math.round((endTime - startTime) / 60_000);
        if (durationMinutes <= 0) {
          entryErrors.end = 'End time must be after start time';
        }
      }

      const amountValue = Number.parseFloat(entry.amount);
      if (!Number.isFinite(amountValue) || amountValue <= 0) {
        entryErrors.amount = 'Amount must be greater than 0';
      }

      if (Object.keys(entryErrors).length > 0) {
        nextErrors[entry.id] = entryErrors;
        continue;
      }

      const amountMl = entry.unit === 'ml' ? amountValue : amountValue * ML_PER_FL_OZ;
      const amountOz = entry.unit === 'oz' ? amountValue : amountValue / ML_PER_FL_OZ;

      normalized.push({
        entry,
        startTime,
        endTime,
        durationMinutes,
        amountMl: Math.round(amountMl * 10) / 10,
        amountOz: Math.round(amountOz * 10) / 10,
        isBottleFed: entry.method === 'bottle',
      });
    }

    this.errors = nextErrors;
    return { valid: Object.keys(nextErrors).length === 0, normalized };
  }

  private async handleSubmit(event: Event) {
    event.preventDefault();

    if (this.submitting) {
      return;
    }

    const { valid, normalized } = this.validateEntries();
    if (!valid) {
      this.submissionError = 'Please fix the highlighted fields.';
      return;
    }

    this.submitting = true;
    this.submissionError = null;

    try {
      const defaultInterval = await settingsService.getDefaultFeedIntervalMinutes();
      const logs: FeedingLog[] = normalized.map(
        ({ entry, startTime, endTime, durationMinutes, amountMl, amountOz, isBottleFed }) => {
          const safeDuration = Math.max(1, durationMinutes);

          return {
            id: crypto.randomUUID(),
            feedType: entry.feedType,
            amountMl,
            amountOz,
            durationMinutes: safeDuration,
            isBottleFed,
            timestamp: endTime,
            startTime,
            endTime,
            nextFeedTime: calculateNextFeedTime(endTime, defaultInterval),
          } satisfies FeedingLog;
        }
      );

      const { feedingStorage } = await import('../services/feeding-storage.js');
      for (const log of logs) {
        await feedingStorage.addLog(log);
      }

      this.dispatchEvent(
        new CustomEvent('logs-imported', {
          detail: logs,
          bubbles: true,
          composed: true,
        })
      );

      this.close();
    } catch (error) {
      console.error('Failed to import feeds', error);
      this.submissionError = 'Something went wrong while importing feeds. Please try again.';
    } finally {
      this.submitting = false;
    }
  }

  render() {
    return html`
      <dialog @cancel=${this.handleCancel}>
        <form @submit=${this.handleSubmit} novalidate>
          <div class="dialog-header">
            <h2>Import feeds</h2>
            <p class="subtitle">Add feedings you tracked elsewhere so summaries stay accurate.</p>
            ${this.submissionError
              ? html`<div class="form-error" role="alert">${this.submissionError}</div>`
              : null}
          </div>

          <div class="dialog-content">
            <div class="entries">
              ${this.entries.map((entry, index) => {
                const durationLabel = this.formatDuration(entry);
                return html`
                  <section class="entry-card" aria-label=${`Feed ${index + 1}`}>
                    <div class="entry-header">
                      <div class="entry-title">Feed ${index + 1}</div>
                      ${this.entries.length > 1
                        ? html`
                            <button
                              type="button"
                              class="remove-btn"
                              @click=${() => this.handleRemoveEntry(entry.id)}
                            >
                              Remove
                            </button>
                          `
                        : null}
                    </div>

                    <div class="entry-grid">
                      <div>
                        <span class="form-label">Feed Type</span>
                        <div class="radio-group" role="radiogroup" aria-label="Feed Type">
                          <label class="radio-option">
                            <input
                              type="radio"
                              name=${`import-feed-type-${entry.id}`}
                              .value=${'formula'}
                              .checked=${entry.feedType === 'formula'}
                              @change=${() => this.handleFeedTypeChange(entry.id, 'formula')}
                            />
                            <span>Formula</span>
                          </label>
                          <label class="radio-option">
                            <input
                              type="radio"
                              name=${`import-feed-type-${entry.id}`}
                              .value=${'milk'}
                              .checked=${entry.feedType === 'milk'}
                              @change=${() => this.handleFeedTypeChange(entry.id, 'milk')}
                            />
                            <span>Breast Milk</span>
                          </label>
                        </div>
                      </div>

                      <div>
                        <label class="form-label" for=${`import-amount-${entry.id}`}>
                          Amount
                        </label>
                        <div class="amount-group">
                          <input
                            id=${`import-amount-${entry.id}`}
                            type="number"
                            min="0"
                            step="0.1"
                            inputmode="decimal"
                            .value=${entry.amount}
                            @input=${(e: Event) =>
                              this.handleAmountChange(
                                entry.id,
                                (e.currentTarget as HTMLInputElement).value
                              )}
                            required
                          />
                          <select
                            aria-label="Amount unit"
                            .value=${entry.unit}
                            @change=${(e: Event) =>
                              this.handleUnitChange(
                                entry.id,
                                (e.currentTarget as HTMLSelectElement).value as UnitType
                              )}
                          >
                            <option value="ml">ml</option>
                            <option value="oz">fl oz</option>
                          </select>
                        </div>
                        ${this.renderFieldError(entry.id, 'amount')}
                      </div>

                      <div>
                        <span class="form-label">Feeding Time</span>
                        <div class="time-grid">
                          <div class="time-input">
                            <label for=${`import-start-${entry.id}`}>Start</label>
                            <input
                              id=${`import-start-${entry.id}`}
                              type="datetime-local"
                              .value=${entry.start}
                              data-initial-focus=${ifDefined(index === 0 ? 'true' : undefined)}
                              @change=${(e: Event) =>
                                this.handleStartChange(
                                  entry.id,
                                  (e.currentTarget as HTMLInputElement).value
                                )}
                              required
                            />
                            ${this.renderFieldError(entry.id, 'start')}
                          </div>
                          <div class="time-input">
                            <label for=${`import-end-${entry.id}`}>End</label>
                            <input
                              id=${`import-end-${entry.id}`}
                              type="datetime-local"
                              .value=${entry.end}
                              @change=${(e: Event) =>
                                this.handleEndChange(
                                  entry.id,
                                  (e.currentTarget as HTMLInputElement).value
                                )}
                              required
                            />
                            ${this.renderFieldError(entry.id, 'end')}
                          </div>
                        </div>
                        <div class="computed-duration" role="status" aria-live="polite">
                          Duration: ${durationLabel}
                        </div>
                      </div>

                      <div>
                        <span class="form-label">Feeding Method</span>
                        <div class="radio-group" role="radiogroup" aria-label="Feeding Method">
                          <label class="radio-option">
                            <input
                              type="radio"
                              name=${`import-method-${entry.id}`}
                              .value=${'bottle'}
                              .checked=${entry.method === 'bottle'}
                              @change=${() => this.handleMethodChange(entry.id, 'bottle')}
                            />
                            <span>Bottle</span>
                          </label>
                          <label class="radio-option">
                            <input
                              type="radio"
                              name=${`import-method-${entry.id}`}
                              .value=${'breast'}
                              .checked=${entry.method === 'breast'}
                              @change=${() => this.handleMethodChange(entry.id, 'breast')}
                            />
                            <span>Breast</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </section>
                `;
              })}

              <button type="button" class="add-entry-btn" @click=${this.handleAddEntry}>
                + Add another feed
              </button>
            </div>
          </div>

          <div class="dialog-actions">
            <button type="button" class="text-btn" @click=${this.handleCancel}>Cancel</button>
            <button type="submit" class="primary-btn" ?disabled=${this.submitting}>
              ${this.submitting ? 'Adding…' : 'Add feeds'}
            </button>
          </div>
        </form>
      </dialog>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'feeding-import-dialog': FeedingImportDialog;
  }
}
