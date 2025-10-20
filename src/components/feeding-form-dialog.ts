import { html, css, PropertyValues } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { calculateNextFeedTime, type FeedingLog, type UnitType } from '../types/feeding-log.js';
import {
  settingsService,
  DEFAULT_FEED_TYPE,
  DEFAULT_FEED_UNIT,
  DEFAULT_BOTTLE_FED,
} from '../services/settings-service.js';
import type { AppSettings } from '../services/settings-service.js';
import { BaseModalDialog } from './base-modal-dialog.js';
import { dialogCancelButtonStyles, dialogHeaderStyles } from './dialog-shared-styles.js';

interface WakeLockSentinelLike extends EventTarget {
  released: boolean;
  release(): Promise<void>;
}

interface WakeLockApi {
  request(type: 'screen'): Promise<WakeLockSentinelLike>;
}

const DEFAULT_FEEDING_DURATION_MINUTES = 20;

@customElement('feeding-form-dialog')
export class FeedingFormDialog extends BaseModalDialog {
  static styles = [
    dialogHeaderStyles,
    dialogCancelButtonStyles,
    css`
      dialog {
        border: none;
        border-radius: var(--md-sys-shape-corner-extra-large);
        padding: 0;
        width: min(560px, calc(100vw - 2rem));
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
        opacity: 0;
        backdrop-filter: blur(24px);
      }

      .dialog-content {
        padding: 1.5rem;
      }

      .start-screen,
      .timer-screen {
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1.75rem;
      }

      .start-intro {
        color: var(--md-sys-color-on-surface-variant);
        font-size: var(--md-sys-typescale-body-large-font-size);
        line-height: var(--md-sys-typescale-body-large-line-height);
      }

      .start-highlights {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 1rem;
      }

      .start-highlight {
        padding: 1rem 1.25rem;
        border-radius: var(--md-sys-shape-corner-large);
        background: var(--md-sys-color-surface-container-lowest);
        border: 1px solid var(--md-sys-color-outline-variant);
        color: var(--md-sys-color-on-surface-variant);
        font-size: var(--md-sys-typescale-body-medium-font-size);
        line-height: var(--md-sys-typescale-body-medium-line-height);
      }

      .timer-highlight {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
        padding: 1.75rem 1.5rem;
        border-radius: var(--md-sys-shape-corner-extra-large);
        background: var(--md-sys-color-secondary-container);
        color: var(--md-sys-color-on-secondary-container);
        text-align: center;
        box-shadow: var(--md-sys-elevation-1);
      }

      .timer-display {
        font-size: clamp(2.25rem, 8vw, 3.5rem);
        letter-spacing: 0.08em;
        font-weight: 600;
        font-variant-numeric: tabular-nums;
      }

      .timer-metadata {
        display: flex;
        gap: 1.5rem;
        font-size: var(--md-sys-typescale-body-medium-font-size);
        line-height: var(--md-sys-typescale-body-medium-line-height);
      }

      .timer-metadata span {
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
      }

      .timer-metadata .label {
        opacity: 0.8;
        font-size: var(--md-sys-typescale-label-small-font-size);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .timer-actions,
      .start-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        padding: 0 1.5rem 1.5rem;
      }

      .time-summary {
        padding: 1.25rem 1.5rem;
        border-radius: var(--md-sys-shape-corner-large);
        background: var(--md-sys-color-surface-container-lowest);
        border: 1px solid var(--md-sys-color-outline-variant);
        display: grid;
        gap: 1rem;
      }

      .time-summary-heading {
        font-weight: 600;
        color: var(--md-sys-color-on-surface);
      }

      .time-summary-grid {
        display: grid;
        gap: 0.75rem;
      }

      .time-summary-item {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 1rem;
      }

      .time-summary-label {
        color: var(--md-sys-color-on-surface-variant);
        font-size: var(--md-sys-typescale-body-medium-font-size);
      }

      .time-summary-value {
        font-weight: 600;
        color: var(--md-sys-color-on-surface);
      }

      .time-summary-duration {
        padding: 0.75rem 1rem;
        border-radius: var(--md-sys-shape-corner-large);
        background: var(--md-sys-color-secondary-container);
        color: var(--md-sys-color-on-secondary-container);
        font-weight: 600;
        text-align: center;
      }

      .time-section {
        display: grid;
        gap: 1rem;
      }

      .manual-entry {
        padding: 0 1.5rem 1.5rem;
        text-align: center;
      }

      .link-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        min-height: var(--md-comp-button-height);
        padding: 0 1rem;
        background: none;
        border: none;
        color: var(--md-sys-color-primary);
        font-size: var(--md-sys-typescale-label-large-font-size);
        font-weight: var(--md-sys-typescale-label-large-font-weight);
        letter-spacing: var(--md-sys-typescale-label-large-letter-spacing);
        cursor: pointer;
        border-radius: var(--md-sys-shape-corner-full);
        transition:
          background-color 0.2s ease,
          color 0.2s ease;
      }

      .link-button:hover,
      .link-button:focus-visible {
        background: color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent);
        color: var(--md-sys-color-primary);
        outline: none;
      }

      .form-group {
        margin-bottom: 1.5rem;
      }

      label {
        display: block;
        font-weight: 500;
        color: var(--md-sys-color-on-surface);
        font-size: var(--md-sys-typescale-body-large-font-size);
      }

      .form-label {
        margin-bottom: 0.5rem;
      }

      input[type='number'],
      input[type='datetime-local'],
      select {
        padding: 0.875rem 1rem;
        border: 1px solid var(--md-sys-color-outline);
        border-radius: var(--md-sys-shape-corner-large);
        font-size: var(--md-sys-typescale-body-large-font-size);
        font-family: inherit;
        background: var(--md-sys-color-surface-container-lowest);
        color: var(--md-sys-color-on-surface);
        transition:
          border-color 0.2s,
          box-shadow 0.2s;
      }

      input[type='number'],
      input[type='datetime-local'] {
        width: 100%;
        box-sizing: border-box;
        min-width: 0;
      }

      select {
        box-sizing: border-box;
        min-width: 0;
        max-width: 100%;
      }

      input[type='number']:focus,
      input[type='datetime-local']:focus,
      select:focus {
        outline: none;
        border-color: var(--md-sys-color-primary);
        box-shadow: 0 0 0 2px var(--md-sys-color-primary-container);
      }

      .radio-group {
        display: flex;
        gap: 1.5rem;
        flex-wrap: wrap;
      }

      .radio-option {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        min-width: 0;
      }

      input[type='radio'] {
        width: 20px;
        height: 20px;
        cursor: pointer;
      }

      .amount-group {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 0.75rem;
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
        padding: 0.875rem 1rem;
        border-radius: var(--md-sys-shape-corner-large);
        background: var(--md-sys-color-surface-container-lowest);
        border: 1px solid var(--md-sys-color-outline-variant);
        font-weight: 500;
        color: var(--md-sys-color-on-surface);
      }

      .dialog-actions {
        display: flex;
        gap: 0.75rem;
        justify-content: flex-end;
        padding: 1.5rem;
        border-top: 1px solid var(--md-sys-color-outline-variant);
      }

      button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--md-comp-button-gap);
        min-height: var(--md-comp-button-height);
        padding: 0 var(--md-comp-button-horizontal-padding);
        border: none;
        border-radius: var(--md-comp-button-shape);
        font-size: var(--md-sys-typescale-label-large-font-size);
        font-weight: var(--md-sys-typescale-label-large-font-weight);
        line-height: var(--md-sys-typescale-label-large-line-height);
        letter-spacing: var(--md-sys-typescale-label-large-letter-spacing);
        cursor: pointer;
        transition:
          background-color 0.2s ease,
          box-shadow 0.2s ease,
          color 0.2s ease;
      }

      .btn-save {
        background: var(--md-sys-color-primary);
        color: var(--md-sys-color-on-primary);
        box-shadow: var(--md-sys-elevation-1);
      }

      .btn-save:hover,
      .btn-save:focus-visible {
        background: var(--md-sys-color-primary-container);
        color: var(--md-sys-color-on-primary-container);
        box-shadow: var(--md-sys-elevation-2);
        outline: none;
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
    `,
  ];

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

  @state()
  private startTime: string = '';

  @state()
  private endTime: string = '';

  @state()
  private view: 'start' | 'timing' | 'form' = 'start';

  @state()
  private timerElapsedMs = 0;

  @state()
  private isManualMode = false;

  private timerStartMs: number | null = null;

  private timerIntervalId: number | null = null;

  private wakeLockSentinel: WakeLockSentinelLike | null = null;

  private wakeLockVisibilityListenerAttached = false;

  private preferredFeedType: 'formula' | 'milk' = DEFAULT_FEED_TYPE;
  private preferredUnit: UnitType = DEFAULT_FEED_UNIT;
  private preferredBottleFed: boolean = DEFAULT_BOTTLE_FED;
  private readonly handleSettingsChanged = (event: Event) => {
    const detail = (event as CustomEvent<AppSettings>).detail;
    if (!detail) {
      return;
    }

    this.preferredFeedType = detail.defaultFeedType;
    this.preferredUnit = detail.defaultFeedUnit;
    this.preferredBottleFed = detail.defaultBottleFed;

    if (this.view === 'start') {
      this.feedType = this.preferredFeedType;
      this.unit = this.preferredUnit;
      this.isBottleFed = this.preferredBottleFed;
    }
  };

  private readonly handleWakeLockRelease = () => {
    if (this.wakeLockSentinel) {
      this.wakeLockSentinel.removeEventListener('release', this.handleWakeLockRelease);
      this.wakeLockSentinel = null;
    }
    this.detachWakeLockVisibilityListener();
  };

  private readonly handleVisibilityChange = () => {
    if (
      document.visibilityState === 'visible' &&
      this.view === 'timing' &&
      !this.wakeLockSentinel
    ) {
      void this.requestWakeLock();
    }
  };

  constructor() {
    super();
    this.resetForm();
  }

  connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener('feeding-tracker-settings-changed', this.handleSettingsChanged);
    void this.loadPreferenceDefaults();
  }

  protected override resetDialogState(): void {
    this.resetForm();
  }

  protected override onBeforeClose(): void {
    this.clearTimer();
  }

  private startTimerTick() {
    if (this.timerIntervalId !== null) {
      window.clearInterval(this.timerIntervalId);
    }

    this.timerIntervalId = window.setInterval(() => {
      if (this.timerStartMs === null) {
        return;
      }
      this.timerElapsedMs = Date.now() - this.timerStartMs;
    }, 1000);
  }

  private stopTimerTick() {
    if (this.timerIntervalId !== null) {
      window.clearInterval(this.timerIntervalId);
      this.timerIntervalId = null;
    }
  }

  private clearTimer() {
    this.stopTimerTick();
    this.timerStartMs = null;
    this.timerElapsedMs = 0;
    void this.releaseWakeLock();
  }

  private attachWakeLockVisibilityListener() {
    if (this.wakeLockVisibilityListenerAttached) {
      return;
    }
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    this.wakeLockVisibilityListenerAttached = true;
  }

  private detachWakeLockVisibilityListener() {
    if (!this.wakeLockVisibilityListenerAttached) {
      return;
    }
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    this.wakeLockVisibilityListenerAttached = false;
  }

  private async requestWakeLock(): Promise<void> {
    const wakeLock = (navigator as Navigator & { wakeLock?: WakeLockApi }).wakeLock;
    if (!wakeLock || this.wakeLockSentinel) {
      return;
    }

    try {
      const sentinel = await wakeLock.request('screen');
      this.wakeLockSentinel = sentinel;
      sentinel.addEventListener('release', this.handleWakeLockRelease);
      this.attachWakeLockVisibilityListener();
    } catch (error) {
      console.warn('[feeding-form-dialog] Failed to acquire screen wake lock', error);
    }
  }

  private async releaseWakeLock(): Promise<void> {
    if (!this.wakeLockSentinel) {
      this.detachWakeLockVisibilityListener();
      return;
    }

    const sentinel = this.wakeLockSentinel;
    this.wakeLockSentinel = null;
    sentinel.removeEventListener('release', this.handleWakeLockRelease);
    this.detachWakeLockVisibilityListener();

    try {
      await sentinel.release();
    } catch (error) {
      console.warn('[feeding-form-dialog] Failed to release screen wake lock', error);
    }
  }

  private startFeeding() {
    this.isManualMode = false;
    this.timerStartMs = Date.now();
    this.timerElapsedMs = 0;
    this.startTime = '';
    this.endTime = '';
    this.duration = 0;
    this.view = 'timing';
    this.startTimerTick();
    void this.requestWakeLock();
  }

  private completeFeeding() {
    if (this.timerStartMs === null) {
      return;
    }

    console.debug('[feeding-form-dialog] completeFeeding start');
    const endMs = Date.now();
    this.stopTimerTick();
    const elapsed = endMs - this.timerStartMs;
    this.timerElapsedMs = elapsed;

    const startDate = new Date(this.timerStartMs);
    const endDate = new Date(endMs);

    this.startTime = this.formatDateTimeLocal(startDate);
    this.endTime = this.formatDateTimeLocal(endDate);
    this.duration = Math.max(1, Math.round(elapsed / 60_000));
    this.view = 'form';
    this.isManualMode = false;
    void this.releaseWakeLock();
    console.debug('[feeding-form-dialog] completeFeeding end', {
      startTime: this.startTime,
      endTime: this.endTime,
      duration: this.duration,
    });
  }

  private enterManualMode() {
    this.isManualMode = true;
    this.view = 'form';
    this.clearTimer();
    this.setDefaultTimes();
  }

  private cancelTimerAndClose() {
    this.clearTimer();
    this.close();
  }

  private formatElapsed(ms: number): string {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (value: number) => value.toString().padStart(2, '0');

    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }

    return `${pad(minutes)}:${pad(seconds)}`;
  }

  private formatDisplayTime(value: string): string {
    const parsed = this.parseDateTimeLocal(value);
    if (!parsed) {
      return '—';
    }

    return parsed.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  private handleDialogCancel = (event: Event) => {
    event.preventDefault();
    this.close();
  };

  protected firstUpdated(changedProperties: PropertyValues): void {
    super.firstUpdated(changedProperties);
    this.dialog?.addEventListener('cancel', this.handleDialogCancel);
  }

  disconnectedCallback(): void {
    this.dialog?.removeEventListener('cancel', this.handleDialogCancel);
    this.clearTimer();
    window.removeEventListener('feeding-tracker-settings-changed', this.handleSettingsChanged);
    super.disconnectedCallback();
  }

  private formatDateTimeLocal(date: Date): string {
    const pad = (value: number) => value.toString().padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  private parseDateTimeLocal(value: string): Date | null {
    if (!value) {
      return null;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }
    return parsed;
  }

  private setDefaultTimes() {
    const end = new Date();
    const start = new Date(end.getTime() - DEFAULT_FEEDING_DURATION_MINUTES * 60_000);
    this.startTime = this.formatDateTimeLocal(start);
    this.endTime = this.formatDateTimeLocal(end);
    this.updateDurationFromTimes();
  }

  private updateDurationFromTimes() {
    const start = this.parseDateTimeLocal(this.startTime);
    const end = this.parseDateTimeLocal(this.endTime);

    if (!start || !end) {
      this.duration = 0;
      return;
    }

    const diffMs = end.getTime() - start.getTime();
    if (diffMs <= 0) {
      this.duration = 0;
      return;
    }

    const minutes = Math.round(diffMs / 60_000);
    this.duration = Math.max(1, minutes);
  }

  private handleStartTimeInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    this.startTime = value;

    const start = this.parseDateTimeLocal(value);
    const end = this.parseDateTimeLocal(this.endTime);

    if (start && (!end || end.getTime() <= start.getTime())) {
      const minutes = this.duration > 0 ? this.duration : DEFAULT_FEEDING_DURATION_MINUTES;
      const adjustedEnd = new Date(start.getTime() + minutes * 60_000);
      this.endTime = this.formatDateTimeLocal(adjustedEnd);
    }

    this.updateDurationFromTimes();
  }

  private handleEndTimeInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value;
    const start = this.parseDateTimeLocal(this.startTime);
    const providedEnd = this.parseDateTimeLocal(value);

    if (start && providedEnd && providedEnd.getTime() <= start.getTime()) {
      const minutes = this.duration > 0 ? this.duration : DEFAULT_FEEDING_DURATION_MINUTES;
      const adjustedEnd = new Date(start.getTime() + minutes * 60_000);
      value = this.formatDateTimeLocal(adjustedEnd);
    } else if (!start && providedEnd) {
      const adjustedStart = new Date(
        providedEnd.getTime() - DEFAULT_FEEDING_DURATION_MINUTES * 60_000
      );
      this.startTime = this.formatDateTimeLocal(adjustedStart);
    }

    this.endTime = value;
    this.updateDurationFromTimes();
  }

  private resetForm() {
    this.feedType = this.preferredFeedType;
    this.amount = 0;
    this.unit = this.preferredUnit;
    this.isBottleFed = this.preferredBottleFed;
    this.view = 'start';
    this.isManualMode = false;
    this.clearTimer();
    this.setDefaultTimes();
  }

  private async loadPreferenceDefaults(): Promise<void> {
    try {
      const settings = await settingsService.getSettings();
      this.preferredFeedType = settings.defaultFeedType;
      this.preferredUnit = settings.defaultFeedUnit;
      this.preferredBottleFed = settings.defaultBottleFed;

      if (this.view === 'start') {
        this.feedType = this.preferredFeedType;
        this.unit = this.preferredUnit;
        this.isBottleFed = this.preferredBottleFed;
      }
    } catch (error) {
      console.error('[feeding-form-dialog] Failed to load preference defaults', error);
    }
  }

  private async handleSubmit(e: Event) {
    e.preventDefault();

    // Convert amount to both ml and oz
    const amountMl = this.unit === 'ml' ? this.amount : this.amount * 29.5735;
    const amountOz = this.unit === 'oz' ? this.amount : this.amount / 29.5735;

    const start = this.parseDateTimeLocal(this.startTime);
    const end = this.parseDateTimeLocal(this.endTime);

    if (!start || !end || end.getTime() <= start.getTime()) {
      return;
    }

    const durationMinutes =
      this.duration > 0
        ? this.duration
        : Math.max(1, Math.round((end.getTime() - start.getTime()) / 60_000));

    const defaultInterval = await settingsService.getDefaultFeedIntervalMinutes();

    const log: FeedingLog = {
      id: crypto.randomUUID(),
      feedType: this.feedType,
      amountMl: Math.round(amountMl * 10) / 10,
      amountOz: Math.round(amountOz * 10) / 10,
      durationMinutes,
      isBottleFed: this.isBottleFed,
      timestamp: end.getTime(),
      startTime: start.getTime(),
      endTime: end.getTime(),
      nextFeedTime: calculateNextFeedTime(end.getTime(), defaultInterval),
    };

    this.dispatchEvent(
      new CustomEvent('log-added', {
        detail: log,
        bubbles: true,
        composed: true,
      })
    );

    this.close();
  }

  private handleCancel() {
    this.close();
  }

  private get isValid(): boolean {
    if (this.amount <= 0 || this.duration <= 0) {
      return false;
    }

    const start = this.parseDateTimeLocal(this.startTime);
    const end = this.parseDateTimeLocal(this.endTime);

    return !!start && !!end && end.getTime() > start.getTime();
  }

  render() {
    return html` <dialog>${this.renderActiveView()}</dialog> `;
  }

  private renderActiveView() {
    switch (this.view) {
      case 'timing':
        return this.renderTimingView();
      case 'form':
        return this.renderFormView();
      case 'start':
      default:
        return this.renderStartView();
    }
  }

  private renderStartView() {
    return html`
      <div class="dialog-header">
        <h2>Track a Feeding</h2>
        <p class="subtitle">Start the timer when the feeding begins.</p>
      </div>
      <div class="start-screen">
        <p class="start-intro">
          We'll keep time for you. Tap “Start feed” right as the feeding begins and we'll capture
          the end time when you're finished.
        </p>
        <div class="start-highlights">
          <div class="start-highlight">Autofill start and end time with a single tap.</div>
          <div class="start-highlight">Review and add details after the feeding wraps up.</div>
        </div>
      </div>
      <div class="start-actions">
        <button type="button" class="dialog-cancel-button" @click=${this.handleCancel}>
          Cancel
        </button>
        <button type="button" class="btn-save" @click=${this.startFeeding}>Start feed</button>
      </div>
      <div class="manual-entry">
        <button type="button" class="link-button" @click=${this.enterManualMode}>
          Enter details manually instead
        </button>
      </div>
    `;
  }

  private renderTimingView() {
    const startDisplay = this.timerStartMs
      ? new Date(this.timerStartMs).toLocaleTimeString(undefined, {
          hour: 'numeric',
          minute: '2-digit',
        })
      : '—';
    const elapsedMinutes = Math.floor(this.timerElapsedMs / 60_000);
    const elapsedLabel = elapsedMinutes >= 1 ? `${elapsedMinutes} min` : '<1 min';

    return html`
      <div class="dialog-header">
        <h2>Feeding in Progress</h2>
        <p class="subtitle">Tap “Feeding done” when the session wraps up.</p>
      </div>
      <div class="timer-screen">
        <div class="timer-highlight">
          <div class="timer-display" aria-live="polite">
            ${this.formatElapsed(this.timerElapsedMs)}
          </div>
          <div class="timer-metadata">
            <span>
              <span class="label">Started</span>
              <span>${startDisplay}</span>
            </span>
            <span>
              <span class="label">Elapsed</span>
              <span>${elapsedLabel}</span>
            </span>
          </div>
        </div>
        <p class="start-intro">
          Keep the timer running while you feed. We'll capture the end time the moment you finish.
        </p>
      </div>
      <div class="timer-actions">
        <button type="button" class="dialog-cancel-button" @click=${this.cancelTimerAndClose}>
          Cancel
        </button>
        <button type="button" class="btn-save" @click=${this.completeFeeding}>Feeding done</button>
      </div>
    `;
  }

  private renderFormView() {
    const title = this.isManualMode ? 'Add Feeding Log' : 'Add Feeding Details';
    const subtitle = this.isManualMode
      ? 'Enter the feeding information below.'
      : 'Timer captured the start and end time. Add the feeding details below.';

    console.debug('[feeding-form-dialog] renderFormView', {
      view: this.view,
      isManualMode: this.isManualMode,
      startTime: this.startTime,
      endTime: this.endTime,
      duration: this.duration,
    });

    return html`
      <div class="dialog-header">
        <h2>${title}</h2>
        <p class="subtitle">${subtitle}</p>
      </div>

      <form @submit=${this.handleSubmit}>
        <div class="dialog-content">
          <div class="form-group">
            <label class="form-label">Feed Type</label>
            <div class="radio-group">
              <div class="radio-option">
                <input
                  type="radio"
                  id="formula"
                  name="feedType"
                  value="formula"
                  .checked=${this.feedType === 'formula'}
                  @change=${() => (this.feedType = 'formula')}
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
                  @change=${() => (this.feedType = 'milk')}
                />
                <label for="milk">Breast Milk</label>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label for="amount" class="form-label">Amount</label>
            <div class="amount-group">
              <input
                type="number"
                id="amount"
                min="0"
                step="0.1"
                .value=${this.amount.toString()}
                @input=${(e: Event) =>
                  (this.amount = parseFloat((e.target as HTMLInputElement).value) || 0)}
                required
              />
              <select
                @change=${(e: Event) =>
                  (this.unit = (e.target as HTMLSelectElement).value as UnitType)}
                .value=${this.unit}
              >
                <option value="ml">ml</option>
                <option value="oz">fl oz</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Feeding Time</label>
            <div class="time-section">
              ${this.isManualMode
                ? html`
                    <div class="time-grid">
                      <div class="time-input">
                        <label for="startTime">Start</label>
                        <input
                          type="datetime-local"
                          id="startTime"
                          .value=${this.startTime}
                          @input=${this.handleStartTimeInput}
                          required
                        />
                      </div>
                      <div class="time-input">
                        <label for="endTime">End</label>
                        <input
                          type="datetime-local"
                          id="endTime"
                          .value=${this.endTime}
                          @input=${this.handleEndTimeInput}
                          required
                        />
                      </div>
                    </div>
                    <div class="computed-duration" role="status" aria-live="polite">
                      Duration: ${this.duration > 0 ? `${this.duration} min` : '—'}
                    </div>
                  `
                : html`
                    <div class="time-summary" role="status" aria-live="polite">
                      <div class="time-summary-heading">Timer captured</div>
                      <div class="time-summary-grid">
                        <div class="time-summary-item">
                          <span class="time-summary-label">Start</span>
                          <span class="time-summary-value"
                            >${this.formatDisplayTime(this.startTime)}</span
                          >
                        </div>
                        <div class="time-summary-item">
                          <span class="time-summary-label">End</span>
                          <span class="time-summary-value"
                            >${this.formatDisplayTime(this.endTime)}</span
                          >
                        </div>
                      </div>
                      <div class="time-summary-duration">
                        Duration: ${this.duration > 0 ? `${this.duration} min` : '—'}
                      </div>
                      <button
                        type="button"
                        class="link-button"
                        @click=${() => (this.isManualMode = true)}
                      >
                        Adjust times manually
                      </button>
                    </div>
                  `}
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Feeding Method</label>
            <div class="radio-group">
              <div class="radio-option">
                <input
                  type="radio"
                  id="bottle"
                  name="feedingMethod"
                  .checked=${this.isBottleFed}
                  @change=${() => (this.isBottleFed = true)}
                />
                <label for="bottle">Bottle</label>
              </div>
              <div class="radio-option">
                <input
                  type="radio"
                  id="other"
                  name="feedingMethod"
                  .checked=${!this.isBottleFed}
                  @change=${() => (this.isBottleFed = false)}
                />
                <label for="other">Breast</label>
              </div>
            </div>
          </div>
        </div>

        <div class="dialog-actions">
          <button type="button" class="dialog-cancel-button" @click=${this.handleCancel}>
            Cancel
          </button>
          <button type="submit" class="btn-save" ?disabled=${!this.isValid}>Save Log</button>
        </div>
      </form>
    `;
  }
}
