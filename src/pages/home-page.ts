import { LitElement, html, css } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';

import type { FeedingLog } from '../types/feeding-log.js';
import type { AppSettings } from '../services/settings-service.js';
import { settingsService } from '../services/settings-service.js';

import '../components/app-toast.js';
import '../components/feeding-log-list.js';
import '../components/feeding-summary-card.js';

import type { FeedingFormDialog } from '../components/feeding-form-dialog.js';
import type { AppToast } from '../components/app-toast.js';
import type { ConfirmDialog } from '../components/confirm-dialog.js';

@customElement('home-page')
export class HomePage extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 1.5rem;
      background-color: var(--md-sys-color-background);
    }

    .container {
      position: relative;
      max-width: 800px;
      margin: 0 auto;
    }

    .add-btn {
      background: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-primary);
      border: none;
      padding: 0.875rem 1.5rem;
      border-radius: var(--md-sys-shape-corner-large);
      font-size: var(--md-sys-typescale-label-large-font-size);
      font-weight: var(--md-sys-typescale-label-large-font-weight);
      cursor: pointer;
      transition:
        background-color 0.2s,
        box-shadow 0.2s;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      box-shadow: var(--md-sys-elevation-1);

      position: fixed;
      right: 16px;
      bottom: calc(45px + var(--bottom-nav-height, 0px));
      z-index: 30;
    }

    .add-btn:hover {
      background: color-mix(in srgb, var(--md-sys-color-primary) 88%, #ffffff 12%);
      box-shadow: var(--md-sys-elevation-2);
    }

    .add-btn:active {
      box-shadow: var(--md-sys-elevation-1);
    }

    .add-btn::before {
      content: '+';
      font-size: 1.5rem;
      line-height: 1;
    }

    .section-title {
      color: var(--md-sys-color-on-surface);
      font-size: var(--md-sys-typescale-title-large-font-size);
      font-weight: var(--md-sys-typescale-title-large-font-weight);
      line-height: var(--md-sys-typescale-title-large-line-height);
      margin-bottom: 1rem;
    }

    .logs-skeleton {
      display: grid;
      gap: 1rem;
    }

    .log-skeleton {
      padding: 1rem;
      border-radius: var(--md-sys-shape-corner-large);
      border: 1px solid var(--md-sys-color-outline-variant);
      background: var(--md-sys-color-surface-container);
      display: grid;
      gap: 0.75rem;
    }

    .log-skeleton__row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .log-skeleton__meta,
    .log-skeleton__details {
      display: grid;
      gap: 0.5rem;
      flex: 1;
    }

    .log-skeleton__details {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.75rem;
    }

    .skeleton {
      position: relative;
      overflow: hidden;
      background: var(--md-sys-color-surface-variant);
      opacity: 0.35;
      border-radius: 999px;
      min-height: 12px;
    }

    .skeleton::after {
      content: '';
      position: absolute;
      inset: 0;
      transform: translateX(-100%);
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.35), transparent);
      animation: skeleton-shimmer 1.4s ease-in-out infinite;
    }

    .skeleton--circle {
      width: 48px;
      height: 48px;
      border-radius: 50%;
    }

    .skeleton--line {
      height: 12px;
      width: 100%;
    }

    .skeleton--line-short {
      width: 55%;
    }

    .skeleton--line-tiny {
      width: 35%;
    }

    @keyframes skeleton-shimmer {
      100% {
        transform: translateX(100%);
      }
    }

    .toast {
      position: fixed;
      left: 50%;
      bottom: calc(88px + var(--bottom-nav-height, 0px));
      transform: translate(-50%, 140%);
      display: grid;
      grid-auto-flow: column;
      grid-template-columns: auto 1fr;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      min-width: 260px;
      max-width: min(420px, 90vw);
      background: var(--md-sys-color-surface-container-highest);
      color: var(--md-sys-color-on-surface);
      border-radius: var(--md-sys-shape-corner-extra-large);
      border: 1px solid var(--md-sys-color-outline-variant);
      box-shadow: var(--md-sys-elevation-3);
      backdrop-filter: blur(18px);
      opacity: 0;
      pointer-events: none;
      z-index: 100;
      transition:
        transform 0.32s cubic-bezier(0.2, 0, 0, 1),
        opacity 0.28s ease;
    }

    .toast.toast--visible {
      transform: translate(-50%, 0);
      opacity: 1;
    }

    .toast__icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 16px;
      background: var(--md-sys-color-secondary-container);
      color: var(--md-sys-color-on-secondary-container);
      font-size: 1.5rem;
      box-shadow: var(--md-sys-elevation-1);
    }

    .toast__content {
      display: grid;
      gap: 0.25rem;
    }

    .toast__headline {
      font-size: var(--md-sys-typescale-title-small-font-size);
      font-weight: var(--md-sys-typescale-title-small-font-weight);
      line-height: var(--md-sys-typescale-title-small-line-height);
      letter-spacing: var(--md-sys-typescale-title-small-letter-spacing);
      color: var(--md-sys-color-on-surface);
    }

    .toast__supporting {
      font-size: var(--md-sys-typescale-body-medium-font-size);
      line-height: var(--md-sys-typescale-body-medium-line-height);
      letter-spacing: var(--md-sys-typescale-body-medium-letter-spacing);
      color: var(--md-sys-color-on-surface-variant);
    }

    @media (min-width: 640px) {
      .add-btn {
        bottom: calc(16px + var(--bottom-nav-height, 0px));
      }
    }
  `;

  @state()
  private logs: FeedingLog[] = [];

  @state()
  private loading: boolean = true;

  @state()
  private hasLoadedInitialData: boolean = false;

  @state()
  private settings: AppSettings | null = null;

  @query('feeding-form-dialog')
  private dialog!: FeedingFormDialog;

  @query('app-toast')
  private toastElement!: AppToast;

  @query('confirm-dialog')
  private confirmDialog!: ConfirmDialog;

  private feedingDialogLoaded = false;
  private confirmDialogLoaded = false;
  private readonly skeletonPlaceholders = [0, 1, 2];

  private readonly handleSettingsChanged = (event: Event) => {
    const detail = (event as CustomEvent<AppSettings>).detail;
    if (!detail) {
      return;
    }
    this.settings = detail;
  };
  async connectedCallback() {
    super.connectedCallback();
    await this.loadSettings();
    window.addEventListener('feeding-tracker-settings-changed', this.handleSettingsChanged);
    await this.loadLogs();

    const queryParams = new URLSearchParams(window.location.search);
    if (queryParams.get('startfeeding')) {
      await this.handleAddClick();
    }
  }

  private async loadSettings(): Promise<void> {
    try {
      this.settings = await settingsService.getSettings();
      window.removeEventListener('feeding-tracker-settings-changed', this.handleSettingsChanged);
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.settings = null;
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.toastElement) {
      this.toastElement.reset();
    }
  }

  private async loadLogs(): Promise<FeedingLog[]> {
    this.loading = true;
    try {
      const { feedingStorage } = await import('../services/feeding-storage.js');

      const loadedLogs = await feedingStorage.loadLogs();
      this.logs = loadedLogs;
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      this.loading = false;
      this.hasLoadedInitialData = true;
    }

    return this.logs;
  }

  public async refreshLogs(): Promise<void> {
    await this.loadLogs();
  }

  private async ensureFeedingDialog(): Promise<void> {
    await this.updateComplete;

    if (!this.feedingDialogLoaded) {
      if (!customElements.get('feeding-form-dialog')) {
        await import('../components/feeding-form-dialog.js');
      }

      await customElements.whenDefined('feeding-form-dialog');
      this.feedingDialogLoaded = true;
    }
  }

  private async ensureConfirmDialog(): Promise<void> {
    await this.updateComplete;

    if (!this.confirmDialogLoaded) {
      if (!customElements.get('confirm-dialog')) {
        await import('../components/confirm-dialog.js');
      }

      await customElements.whenDefined('confirm-dialog');
      this.confirmDialogLoaded = true;
    }
  }

  private async handleAddClick() {
    await this.ensureFeedingDialog();
    this.dialog?.open();
  }

  private async handleLogAdded(e: CustomEvent<FeedingLog>) {
    const { handleLogAddition } = await import('../utils/log-addition.js');

    await handleLogAddition(
      e.detail,
      this.toastElement,
      () => this.loadLogs(),
      (log) => this.maybeShowNextFeedNotification(log)
    );
  }

  private async handleLogDeleted(e: CustomEvent<string>) {
    await this.ensureConfirmDialog();

    const { handleLogDeletion } = await import('../utils/log-deletion.js');

    if (!this.confirmDialog) {
      return;
    }

    await handleLogDeletion(e.detail, this.confirmDialog, () => this.loadLogs());
  }

  private async maybeShowNextFeedNotification(log: FeedingLog) {
    if (!this.settings) {
      await this.loadSettings();
    }

    if (this.settings?.enableNextFeedReminder === false) {
      return;
    }

    const { showNextFeedNotification } = await import('../utils/feed-notifications.js');
    await showNextFeedNotification(log);
  }

  render() {
    const shouldShowSummary = this.hasLoadedInitialData && this.logs.length > 0;
    const showAiSummary = this.settings?.showAiSummaryCard !== false;

    return html`
      <div class="container">
        ${shouldShowSummary
          ? html`
              <feeding-summary-card
                .logs=${this.logs}
                .loading=${this.loading}
                .showAiSummary=${showAiSummary}
              ></feeding-summary-card>
            `
          : null}
        <div class="logs-section">
          <h2 class="section-title">Recent Feedings</h2>
          ${this.loading
            ? html`
                <div
                  class="logs-skeleton"
                  role="status"
                  aria-live="polite"
                  aria-busy="true"
                  aria-label="Loading recent feedings"
                >
                  ${this.skeletonPlaceholders.map(
                    () => html`
                      <div class="log-skeleton" aria-hidden="true">
                        <div class="log-skeleton__row">
                          <div class="skeleton skeleton--circle"></div>
                          <div class="log-skeleton__meta">
                            <div class="skeleton skeleton--line"></div>
                            <div class="skeleton skeleton--line skeleton--line-short"></div>
                          </div>
                        </div>
                        <div class="log-skeleton__details">
                          <div class="skeleton skeleton--line"></div>
                          <div class="skeleton skeleton--line"></div>
                          <div class="skeleton skeleton--line skeleton--line-tiny"></div>
                        </div>
                      </div>
                    `
                  )}
                </div>
              `
            : html`
                <feeding-log-list
                  .logs=${this.logs}
                  @log-add-requested=${this.handleAddClick}
                  @log-deleted=${this.handleLogDeleted}
                ></feeding-log-list>
              `}
        </div>

        <button class="add-btn" @click=${this.handleAddClick}>Start feeding</button>

        <feeding-form-dialog @log-added=${this.handleLogAdded}></feeding-form-dialog>
      </div>
      <app-toast></app-toast>
      <confirm-dialog></confirm-dialog>
    `;
  }
}
