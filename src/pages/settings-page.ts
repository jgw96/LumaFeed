import { LitElement, html, css } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import {
  settingsService,
  MIN_FEED_INTERVAL_MINUTES,
  MAX_FEED_INTERVAL_MINUTES,
  FEED_INTERVAL_STEP_MINUTES,
  DEFAULT_ENABLE_NEXT_FEED_REMINDER,
  DEFAULT_FEED_UNIT,
  DEFAULT_FEED_TYPE,
  DEFAULT_BOTTLE_FED,
  DEFAULT_SHOW_AI_SUMMARY_CARD,
  DEFAULT_THEME_COLOR,
} from '../services/settings-service.js';
import type { AppSettings } from '../services/settings-service.js';
import type { AppToast } from '../components/app-toast.js';
import '../components/app-toast.js';
import { DEFAULT_NEXT_FEED_INTERVAL_MINUTES, type UnitType } from '../types/feeding-log.js';
import { setThemeColor } from '../utils/theme/apply-theme.js';

@customElement('settings-page')
export class SettingsPage extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 1.5rem;
      background-color: var(--md-sys-color-background);
    }

    .container {
      max-width: 720px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .hero {
      display: grid;
      gap: 0.75rem;
      padding: 2rem;
      border-radius: var(--md-sys-shape-corner-extra-large);
      background:
        linear-gradient(
          135deg,
          color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent),
          transparent 45%
        ),
        var(--md-sys-color-surface-container-highest);
      border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 65%, transparent);
      box-shadow: var(--md-sys-elevation-2);
    }

    h1 {
      color: var(--md-sys-color-on-background);
      margin: 0 0 0.5rem;
      font-size: var(--md-sys-typescale-headline-large-font-size);
      font-weight: var(--md-sys-typescale-headline-large-font-weight);
      line-height: var(--md-sys-typescale-headline-large-line-height);
    }

    p.description {
      color: var(--md-sys-color-on-surface-variant);
      margin: 0;
      line-height: 1.6;
      font-size: var(--md-sys-typescale-body-large-font-size);
    }

    form {
      display: grid;
      gap: 2rem;
    }

    .form-group {
      display: grid;
      gap: 0.5rem;
    }

    .section {
      display: grid;
      gap: 1.25rem;
      padding: 1.5rem;
      border-radius: var(--md-sys-shape-corner-extra-large);
      background: var(--md-sys-color-surface-container-highest);
      border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 65%, transparent);
      box-shadow: var(--md-sys-elevation-1);
    }

    .section__header {
      display: grid;
      gap: 0.5rem;
    }

    .section__title {
      margin: 0;
      color: var(--md-sys-color-on-surface);
      font-size: var(--md-sys-typescale-title-large-font-size);
      font-weight: var(--md-sys-typescale-title-large-font-weight);
      line-height: var(--md-sys-typescale-title-large-line-height);
    }

    .section__description {
      margin: 0;
      color: var(--md-sys-color-on-surface-variant);
      font-size: var(--md-sys-typescale-body-medium-font-size);
      line-height: var(--md-sys-typescale-body-medium-line-height);
    }

    label {
      color: var(--md-sys-color-on-surface);
      font-weight: 600;
      font-size: var(--md-sys-typescale-title-small-font-size);
    }

    input[type='number'] {
      width: 120px;
      padding: 0.75rem 1rem;
      border-radius: var(--md-sys-shape-corner-large);
      border: 1px solid var(--md-sys-color-outline);
      font-size: var(--md-sys-typescale-body-large-font-size);
      background: var(--md-sys-color-surface-container-lowest);
      color: var(--md-sys-color-on-surface);
    }

    input[type='number']:focus {
      outline: none;
      border-color: var(--md-sys-color-primary);
      box-shadow: 0 0 0 2px var(--md-sys-color-primary-container);
    }

    .theme-color {
      display: grid;
      gap: 0.5rem;
    }

    .theme-color__controls {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 1.25rem;
    }

    .theme-color__picker {
      position: relative;
      width: 72px;
      height: 72px;
      padding: 12px;
      border-radius: var(--md-sys-shape-corner-extra-large);
      border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 55%, transparent);
      background:
        linear-gradient(
          145deg,
          color-mix(in srgb, var(--md-sys-color-primary) 18%, transparent),
          transparent 55%
        ),
        var(--md-sys-color-surface-container-highest);
      box-shadow: var(--md-sys-elevation-1);
      display: grid;
      place-items: center;
      transition:
        transform 0.2s ease,
        box-shadow 0.2s ease;
    }

    .theme-color__picker input[type='color'] {
      appearance: none;
      border: none;
      padding: 0;
      width: 100%;
      height: 100%;
      background: transparent;
      cursor: pointer;
      border-radius: 999px;
      box-shadow:
        inset 0 0 0 1px color-mix(in srgb, #000 12%, transparent),
        inset 0 0 0 3px color-mix(in srgb, #fff 18%, transparent);
    }

    .theme-color__picker input[type='color']::-webkit-color-swatch-wrapper {
      padding: 0;
      border-radius: inherit;
    }

    .theme-color__picker input[type='color']::-webkit-color-swatch {
      border: none;
      border-radius: inherit;
    }

    .theme-color__picker input[type='color']::-moz-color-swatch {
      border: none;
      border-radius: inherit;
    }

    .theme-color__picker:has(input[type='color']:focus-visible) {
      box-shadow:
        var(--md-sys-elevation-2),
        0 0 0 4px color-mix(in srgb, var(--md-sys-color-primary) 25%, transparent);
      transform: translateY(-1px);
    }

    .theme-color__picker:hover {
      box-shadow: var(--md-sys-elevation-2);
      transform: translateY(-1px);
    }

    .theme-color__value {
      font-family:
        'Roboto Mono', ui-monospace, SFMono-Regular, SFMono, Menlo, Monaco, Consolas,
        'Liberation Mono', 'Courier New', monospace;
      font-size: var(--md-sys-typescale-body-medium-font-size);
      color: var(--md-sys-color-on-surface-variant);
      background: var(--md-sys-color-surface-container-low);
      padding: 0.45rem 0.8rem;
      border-radius: var(--md-sys-shape-corner-medium);
      border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 45%, transparent);
      font-variant-numeric: tabular-nums;
    }

    .theme-color__reset {
      padding: 0.65rem 1.5rem;
      border-radius: var(--md-sys-shape-corner-extra-large);
      border: none;
      background: var(--md-sys-color-secondary-container);
      color: var(--md-sys-color-on-secondary-container);
      font-weight: var(--md-sys-typescale-label-large-font-weight);
      font-size: var(--md-sys-typescale-label-large-font-size);
      cursor: pointer;
      box-shadow: var(--md-sys-elevation-1);
      transition:
        transform 0.2s ease,
        box-shadow 0.2s ease,
        background-color 0.2s ease;
    }

    .theme-color__reset:hover:not(:disabled),
    .theme-color__reset:focus-visible {
      background: color-mix(
        in srgb,
        var(--md-sys-color-secondary-container) 85%,
        var(--md-sys-color-primary) 15%
      );
      box-shadow: var(--md-sys-elevation-2);
      transform: translateY(-1px);
    }

    .theme-color__reset:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      box-shadow: none;
      transform: none;
    }

    .helper-text {
      color: var(--md-sys-color-on-surface-variant);
      font-size: var(--md-sys-typescale-body-medium-font-size);
      line-height: 1.4;
    }

    .switch {
      display: inline-flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1rem 1.25rem;
      border-radius: var(--md-sys-shape-corner-large);
      background: var(--md-sys-color-surface-container-highest);
      border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 65%, transparent);
    }

    .switch__label {
      display: grid;
      gap: 0.25rem;
    }

    .switch__title {
      font-size: var(--md-sys-typescale-title-small-font-size);
      font-weight: var(--md-sys-typescale-title-small-font-weight);
      color: var(--md-sys-color-on-surface);
    }

    .switch__supporting {
      font-size: var(--md-sys-typescale-body-small-font-size);
      color: var(--md-sys-color-on-surface-variant);
    }

    .switch__control {
      position: relative;
      width: 56px;
      height: 32px;
      flex-shrink: 0;
    }

    .switch__input {
      opacity: 0;
      width: 100%;
      height: 100%;
      margin: 0;
      position: absolute;
      inset: 0;
      cursor: pointer;
    }

    .switch__track {
      position: absolute;
      inset: 0;
      border-radius: 999px;
      background: color-mix(in srgb, var(--md-sys-color-outline) 24%, transparent);
      transition: background-color 0.25s ease;
    }

    .switch__thumb {
      position: absolute;
      top: 4px;
      left: 6px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: var(--md-sys-color-on-surface);
      box-shadow: var(--md-sys-elevation-1);
      transition:
        transform 0.25s ease,
        background-color 0.25s ease;
    }

    .switch[data-checked] .switch__track {
      background: var(--md-sys-color-primary);
    }

    .switch[data-checked] .switch__thumb {
      background: var(--md-sys-color-on-primary);
      transform: translateX(24px);
      box-shadow: var(--md-sys-elevation-2);
    }

    .switch[data-disabled] {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .switch[data-disabled] .switch__input {
      cursor: not-allowed;
    }

    .choice-group {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .choice-pill {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border-radius: 999px;
      background: var(--md-sys-color-surface-container);
      color: var(--md-sys-color-on-surface-variant);
      border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 65%, transparent);
      font-size: var(--md-sys-typescale-body-medium-font-size);
      font-weight: 500;
      cursor: pointer;
      transition:
        background-color 0.2s ease,
        color 0.2s ease,
        box-shadow 0.2s ease;
    }

    .choice-pill[data-checked] {
      background: var(--md-sys-color-secondary-container);
      color: var(--md-sys-color-on-secondary-container);
      box-shadow: var(--md-sys-elevation-1);
      border-color: transparent;
    }

    .choice-pill[data-disabled] {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .choice-pill input[type='radio'] {
      position: absolute;
      inset: 0;
      opacity: 0;
      margin: 0;
      cursor: inherit;
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }

    button[type='submit'] {
      padding: 0.65rem 1.5rem;
      border: none;
      border-radius: var(--md-sys-shape-corner-extra-large);
      background: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-primary);
      font-weight: var(--md-sys-typescale-label-large-font-weight);
      font-size: var(--md-sys-typescale-label-large-font-size);
      cursor: pointer;
      box-shadow: var(--md-sys-elevation-1);
      transition:
        background-color 0.2s ease,
        box-shadow 0.2s ease;
    }

    button[type='submit']:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      box-shadow: none;
    }

    .status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: var(--md-sys-typescale-body-medium-font-size);
      min-height: 1.5rem;
    }

    .status.success {
      color: var(--md-sys-color-on-secondary-container);
    }

    .status.error {
      color: var(--md-sys-color-error);
    }

    .loading {
      color: var(--md-sys-color-on-surface-variant);
      font-size: var(--md-sys-typescale-body-medium-font-size);
    }
  `;

  @state()
  private defaultInterval: number = DEFAULT_NEXT_FEED_INTERVAL_MINUTES;

  @state()
  private loading = true;

  @state()
  private saving = false;

  @state()
  private statusMessage: { type: 'success' | 'error'; text: string } | null = null;

  @state()
  private enableNextFeedReminder = DEFAULT_ENABLE_NEXT_FEED_REMINDER;

  @state()
  private defaultUnit: UnitType = DEFAULT_FEED_UNIT;

  @state()
  private defaultFeedType: 'formula' | 'milk' = DEFAULT_FEED_TYPE;

  @state()
  private defaultBottleFed: boolean = DEFAULT_BOTTLE_FED;

  @state()
  private showAiSummaryCard = DEFAULT_SHOW_AI_SUMMARY_CARD;

  @state()
  private themeColor: string = DEFAULT_THEME_COLOR;

  @query('app-toast')
  private toastElement?: AppToast;

  private pendingUpdate: Partial<AppSettings> = {};
  private saveTimeoutId: number | null = null;

  connectedCallback(): void {
    super.connectedCallback();
    this.loadSettings();
  }

  disconnectedCallback(): void {
    this.clearSaveTimeout();
    super.disconnectedCallback();
  }

  private async loadSettings(): Promise<void> {
    this.loading = true;
    try {
      const settings = await settingsService.getSettings();
      this.applySettings(settings);
      this.statusMessage = null;
    } catch (error) {
      console.error('Failed to load settings.', error);
      this.statusMessage = {
        type: 'error',
        text: 'Unable to load settings. Using defaults.',
      };
      this.defaultInterval = DEFAULT_NEXT_FEED_INTERVAL_MINUTES;
      this.enableNextFeedReminder = DEFAULT_ENABLE_NEXT_FEED_REMINDER;
      this.defaultUnit = DEFAULT_FEED_UNIT;
      this.defaultFeedType = DEFAULT_FEED_TYPE;
      this.defaultBottleFed = DEFAULT_BOTTLE_FED;
      this.showAiSummaryCard = DEFAULT_SHOW_AI_SUMMARY_CARD;
      this.themeColor = DEFAULT_THEME_COLOR;
    } finally {
      this.loading = false;
    }
  }

  private applySettings(settings: AppSettings): void {
    this.defaultInterval = settings.defaultFeedIntervalMinutes;
    this.enableNextFeedReminder = settings.enableNextFeedReminder;
    this.defaultUnit = settings.defaultFeedUnit;
    this.defaultFeedType = settings.defaultFeedType;
    this.defaultBottleFed = settings.defaultBottleFed;
    this.showAiSummaryCard = settings.showAiSummaryCard;
    this.themeColor = settings.themeColor ?? DEFAULT_THEME_COLOR;
  }

  private scheduleSave(partial: Partial<AppSettings>): void {
    this.pendingUpdate = { ...this.pendingUpdate, ...partial };
    this.statusMessage = null;

    this.clearSaveTimeout();
    this.saveTimeoutId = window.setTimeout(() => {
      this.saveTimeoutId = null;
      void this.flushPendingSave();
    }, 300);
  }

  private async flushPendingSave(): Promise<void> {
    if (this.saving) {
      return;
    }

    const payload = this.pendingUpdate;
    if (!payload || Object.keys(payload).length === 0) {
      return;
    }

    this.pendingUpdate = {};
    this.saving = true;

    try {
      const updated = await settingsService.updateSettings(payload);
      this.applySettings(updated);
      this.statusMessage = null;
      await this.toastElement?.show({
        headline: 'Settings updated',
        supporting: 'Your preferences are now active.',
        icon: '✓',
      });
    } catch (error) {
      console.error('Failed to save settings.', error);
      this.statusMessage = {
        type: 'error',
        text: 'Could not save changes. Try again.',
      };
    } finally {
      this.saving = false;
      if (this.pendingUpdate && Object.keys(this.pendingUpdate).length > 0) {
        this.clearSaveTimeout();
        this.saveTimeoutId = window.setTimeout(() => {
          this.saveTimeoutId = null;
          void this.flushPendingSave();
        }, 150);
      }
    }
  }

  private clearSaveTimeout(): void {
    if (this.saveTimeoutId !== null) {
      window.clearTimeout(this.saveTimeoutId);
      this.saveTimeoutId = null;
    }
  }

  private handleIntervalInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = Number.parseInt(input.value, 10);
    if (Number.isNaN(value)) {
      this.defaultInterval = DEFAULT_NEXT_FEED_INTERVAL_MINUTES;
      return;
    }

    this.defaultInterval = value;
    this.scheduleSave({ defaultFeedIntervalMinutes: this.defaultInterval });
  }

  private handleReminderToggle(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.enableNextFeedReminder = input.checked;
    this.scheduleSave({ enableNextFeedReminder: this.enableNextFeedReminder });
  }

  private handleAiSummaryToggle(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.showAiSummaryCard = input.checked;
    this.scheduleSave({ showAiSummaryCard: this.showAiSummaryCard });
  }

  private handleThemeColorChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input?.value) {
      return;
    }

    const value = input.value.toLowerCase();
    this.themeColor = value;
    setThemeColor(value);
    this.scheduleSave({ themeColor: value });
  }

  private handleThemeColorReset(): void {
    if (this.themeColor === DEFAULT_THEME_COLOR) {
      return;
    }

    this.themeColor = DEFAULT_THEME_COLOR;
    setThemeColor(DEFAULT_THEME_COLOR);
    this.scheduleSave({ themeColor: DEFAULT_THEME_COLOR });
  }

  private handleUnitChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.checked) {
      this.defaultUnit = input.value as UnitType;
      this.scheduleSave({ defaultFeedUnit: this.defaultUnit });
    }
  }

  private handleFeedTypeChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.checked) {
      this.defaultFeedType = input.value as 'formula' | 'milk';
      this.scheduleSave({ defaultFeedType: this.defaultFeedType });
    }
  }

  private handleBottleFedChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.checked) {
      this.defaultBottleFed = input.value === 'true';
      this.scheduleSave({ defaultBottleFed: this.defaultBottleFed });
    }
  }

  private renderStatus() {
    if (!this.statusMessage) {
      return null;
    }

    return html`
      <div class="status ${this.statusMessage.type}" role="status" aria-live="polite">
        ${this.statusMessage.text}
      </div>
    `;
  }

  render() {
    return html`
      <div class="container">
        <div class="hero">
          <h1>Settings</h1>
          <p class="description">
            Adjust how the tracker behaves. Updates apply to future feeding entries.
          </p>
        </div>

        <form aria-busy=${this.loading || this.saving}>
          ${this.renderStatus()}
          <section class="section">
            <div class="section__header">
              <h2 class="section__title">Appearance</h2>
              <p class="section__description">
                Choose the accent color used across buttons, highlights, and charts.
              </p>
            </div>

            <div class="theme-color">
              <label for="theme-color-input">Theme color</label>
              <div class="theme-color__controls">
                <span class="theme-color__picker">
                  <input
                    id="theme-color-input"
                    type="color"
                    name="theme-color"
                    aria-label="Pick theme color"
                    .value=${this.themeColor}
                    @input=${this.handleThemeColorChange}
                    ?disabled=${this.loading}
                  />
                </span>
                <button
                  class="theme-color__reset"
                  type="button"
                  @click=${this.handleThemeColorReset}
                  ?disabled=${this.loading || this.themeColor === DEFAULT_THEME_COLOR}
                >
                  Reset to default
                </button>
              </div>
            </div>
          </section>
          <section class="section">
            <div class="section__header">
              <h2 class="section__title">Feeding rhythm</h2>
              <p class="section__description">
                Tune the schedule and reminders used for upcoming feeds.
              </p>
            </div>

            <div class="form-group">
              <label for="default-feed-interval">Default feed interval (minutes)</label>
              <input
                id="default-feed-interval"
                name="default-feed-interval"
                type="number"
                min=${MIN_FEED_INTERVAL_MINUTES}
                max=${MAX_FEED_INTERVAL_MINUTES}
                step=${FEED_INTERVAL_STEP_MINUTES}
                .value=${String(this.defaultInterval)}
                @input=${this.handleIntervalInput}
                ?disabled=${this.loading}
                required
              />
              <p class="helper-text">
                Choose how far apart feedings are scheduled by default. Minimum
                ${MIN_FEED_INTERVAL_MINUTES} minutes, maximum ${MAX_FEED_INTERVAL_MINUTES} minutes.
              </p>
            </div>

            <label
              class="switch"
              ?data-checked=${this.enableNextFeedReminder}
              ?data-disabled=${this.loading}
            >
              <span class="switch__label">
                <span class="switch__title">Next feed reminder</span>
                <span class="switch__supporting"
                  >Show a device notification after saving a feeding.</span
                >
              </span>
              <span class="switch__control">
                <input
                  class="switch__input"
                  type="checkbox"
                  name="next-feed-reminder"
                  .checked=${this.enableNextFeedReminder}
                  @change=${this.handleReminderToggle}
                  ?disabled=${this.loading}
                />
                <span class="switch__track"></span>
                <span class="switch__thumb"></span>
              </span>
            </label>
          </section>

          <section class="section">
            <div class="section__header">
              <h2 class="section__title">Entry defaults</h2>
              <p class="section__description">
                Pick the options that should be preselected when starting a new feeding.
              </p>
            </div>

            <div class="form-group">
              <span class="helper-text">Preferred feed type</span>
              <div class="choice-group" role="radiogroup" aria-label="Default feed type">
                <label
                  class="choice-pill"
                  ?data-checked=${this.defaultFeedType === 'formula'}
                  ?data-disabled=${this.loading}
                >
                  <input
                    type="radio"
                    name="default-feed-type"
                    value="formula"
                    .checked=${this.defaultFeedType === 'formula'}
                    @change=${this.handleFeedTypeChange}
                    ?disabled=${this.loading}
                  />
                  Formula
                </label>
                <label
                  class="choice-pill"
                  ?data-checked=${this.defaultFeedType === 'milk'}
                  ?data-disabled=${this.loading}
                >
                  <input
                    type="radio"
                    name="default-feed-type"
                    value="milk"
                    .checked=${this.defaultFeedType === 'milk'}
                    @change=${this.handleFeedTypeChange}
                    ?disabled=${this.loading}
                  />
                  Breast milk
                </label>
              </div>
            </div>

            <div class="form-group">
              <span class="helper-text">Preferred unit</span>
              <div class="choice-group" role="radiogroup" aria-label="Default unit">
                <label
                  class="choice-pill"
                  ?data-checked=${this.defaultUnit === 'ml'}
                  ?data-disabled=${this.loading}
                >
                  <input
                    type="radio"
                    name="default-unit"
                    value="ml"
                    .checked=${this.defaultUnit === 'ml'}
                    @change=${this.handleUnitChange}
                    ?disabled=${this.loading}
                  />
                  Milliliters
                </label>
                <label
                  class="choice-pill"
                  ?data-checked=${this.defaultUnit === 'oz'}
                  ?data-disabled=${this.loading}
                >
                  <input
                    type="radio"
                    name="default-unit"
                    value="oz"
                    .checked=${this.defaultUnit === 'oz'}
                    @change=${this.handleUnitChange}
                    ?disabled=${this.loading}
                  />
                  Ounces
                </label>
              </div>
            </div>

            <div class="form-group">
              <span class="helper-text">Typical session</span>
              <div class="choice-group" role="radiogroup" aria-label="Default feeding style">
                <label
                  class="choice-pill"
                  ?data-checked=${this.defaultBottleFed}
                  ?data-disabled=${this.loading}
                >
                  <input
                    type="radio"
                    name="default-bottle-fed"
                    value="true"
                    .checked=${this.defaultBottleFed}
                    @change=${this.handleBottleFedChange}
                    ?disabled=${this.loading}
                  />
                  Bottle feeding
                </label>
                <label
                  class="choice-pill"
                  ?data-checked=${!this.defaultBottleFed}
                  ?data-disabled=${this.loading}
                >
                  <input
                    type="radio"
                    name="default-bottle-fed"
                    value="false"
                    .checked=${!this.defaultBottleFed}
                    @change=${this.handleBottleFedChange}
                    ?disabled=${this.loading}
                  />
                  Breast feeding
                </label>
              </div>
            </div>
          </section>

          <section class="section">
            <div class="section__header">
              <h2 class="section__title">Insights</h2>
              <p class="section__description">
                Control the AI summary card shown on the home screen.
              </p>
            </div>

            <label
              class="switch"
              ?data-checked=${this.showAiSummaryCard}
              ?data-disabled=${this.loading}
            >
              <span class="switch__label">
                <span class="switch__title">Show AI summary</span>
                <span class="switch__supporting"
                  >Keep the on-device summary card visible on the home screen.</span
                >
              </span>
              <span class="switch__control">
                <input
                  class="switch__input"
                  type="checkbox"
                  name="show-ai-summary"
                  .checked=${this.showAiSummaryCard}
                  @change=${this.handleAiSummaryToggle}
                  ?disabled=${this.loading}
                />
                <span class="switch__track"></span>
                <span class="switch__thumb"></span>
              </span>
            </label>
          </section>
        </form>

        ${this.loading
          ? html`<div class="loading" role="status">Loading current settings…</div>`
          : null}

        <app-toast></app-toast>
      </div>
    `;
  }
}
