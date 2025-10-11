import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import {
  settingsService,
  MIN_FEED_INTERVAL_MINUTES,
  MAX_FEED_INTERVAL_MINUTES,
  FEED_INTERVAL_STEP_MINUTES,
} from '../services/settings-service.js';
import { DEFAULT_NEXT_FEED_INTERVAL_MINUTES } from '../types/feeding-log.js';

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
      background: var(--md-sys-color-surface-container-low);
      padding: 1.75rem;
      border-radius: var(--md-sys-shape-corner-extra-large);
      border: 1px solid var(--md-sys-color-outline-variant);
      display: grid;
      gap: 1.25rem;
    }

    .form-group {
      display: grid;
      gap: 0.5rem;
    }

    label {
      color: var(--md-sys-color-on-surface);
      font-weight: 600;
      font-size: var(--md-sys-typescale-title-small-font-size);
    }

    input[type="number"] {
      width: 120px;
      padding: 0.75rem 1rem;
      border-radius: var(--md-sys-shape-corner-large);
      border: 1px solid var(--md-sys-color-outline);
      font-size: var(--md-sys-typescale-body-large-font-size);
      background: var(--md-sys-color-surface-container-lowest);
      color: var(--md-sys-color-on-surface);
    }

    input[type="number"]:focus {
      outline: none;
      border-color: var(--md-sys-color-primary);
      box-shadow: 0 0 0 2px var(--md-sys-color-primary-container);
    }

    .helper-text {
      color: var(--md-sys-color-on-surface-variant);
      font-size: var(--md-sys-typescale-body-medium-font-size);
      line-height: 1.4;
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }

    button[type="submit"] {
      padding: 0.65rem 1.5rem;
      border: none;
      border-radius: var(--md-sys-shape-corner-extra-large);
      background: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-primary);
      font-weight: var(--md-sys-typescale-label-large-font-weight);
      font-size: var(--md-sys-typescale-label-large-font-size);
      cursor: pointer;
      box-shadow: var(--md-sys-elevation-1);
      transition: background-color 0.2s ease, box-shadow 0.2s ease;
    }

    button[type="submit"]:disabled {
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

  connectedCallback(): void {
    super.connectedCallback();
    this.loadSettings();
  }

  private async loadSettings(): Promise<void> {
    this.loading = true;
    try {
      const { defaultFeedIntervalMinutes } = await settingsService.getSettings();
      this.defaultInterval = defaultFeedIntervalMinutes;
      this.statusMessage = null;
    } catch (error) {
      console.error('Failed to load settings.', error);
      this.statusMessage = {
        type: 'error',
        text: 'Unable to load settings. Using defaults.',
      };
      this.defaultInterval = DEFAULT_NEXT_FEED_INTERVAL_MINUTES;
    } finally {
      this.loading = false;
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
    this.statusMessage = null;
  }

  private async handleSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.saving = true;

    try {
      const updated = await settingsService.updateSettings({
        defaultFeedIntervalMinutes: this.defaultInterval,
      });
      this.defaultInterval = updated.defaultFeedIntervalMinutes;
      this.statusMessage = {
        type: 'success',
        text: 'Settings saved. New sessions will use this interval.',
      };
    } catch (error) {
      console.error('Failed to save settings.', error);
      this.statusMessage = {
        type: 'error',
        text: 'Could not save changes. Try again.',
      };
    } finally {
      this.saving = false;
    }
  }

  private renderStatus() {
    if (!this.statusMessage) {
      return html`<div class="status" aria-live="polite"></div>`;
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
        <div>
          <h1>Settings</h1>
          <p class="description">
            Adjust how the tracker behaves. Updates apply to future feeding entries.
          </p>
        </div>

        <form @submit=${this.handleSubmit}>
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
              ?disabled=${this.loading || this.saving}
              required
            />
            <p class="helper-text">
              Choose how far apart feedings are scheduled by default. Minimum ${MIN_FEED_INTERVAL_MINUTES} minutes,
              maximum ${MAX_FEED_INTERVAL_MINUTES} minutes.
            </p>
          </div>

          ${this.renderStatus()}

          <div class="actions">
            <button type="submit" ?disabled=${this.loading || this.saving}>
              ${this.saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>

        ${this.loading
          ? html`<div class="loading" role="status">Loading current settings…</div>`
          : null}
      </div>
    `;
  }
}
