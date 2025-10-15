import { LitElement, html, css } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';

import type { FeedingLog } from '../types/feeding-log.js';

import '../components/app-toast.js';
import '../components/feeding-form-dialog.js';
import '../components/feeding-log-list.js';
import '../components/feeding-summary-card.js';
import '../components/confirm-dialog.js';

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
      background: var(--md-sys-color-primary-container);
      color: var(--md-sys-color-on-primary-container);
      border: none;
      padding: 0.875rem 1.5rem;
      border-radius: var(--md-sys-shape-corner-large);
      font-size: var(--md-sys-typescale-label-large-font-size);
      font-weight: var(--md-sys-typescale-label-large-font-weight);
      cursor: pointer;
      transition: background-color 0.2s, box-shadow 0.2s;
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
      background: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-primary);
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

    .loading {
      text-align: center;
      padding: 2rem;
      color: var(--md-sys-color-on-surface-variant);
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
      transition: transform 0.32s cubic-bezier(0.2, 0, 0, 1), opacity 0.28s ease;
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

    @media(min-width: 640px) {
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

  @query('feeding-form-dialog')
  private dialog!: FeedingFormDialog;

  @query('app-toast')
  private toastElement!: AppToast;

  @query('confirm-dialog')
  private confirmDialog!: ConfirmDialog;

  async connectedCallback() {
    super.connectedCallback();
    await this.loadLogs();

    const queryParams = new URLSearchParams(window.location.search);
    if (queryParams.get('startfeeding')) {
      this.handleAddClick();
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

  private handleAddClick() {
    this.dialog.open();
  }

  private async handleLogAdded(e: CustomEvent<FeedingLog>) {
    try {
      const { feedingStorage } = await import('../services/feeding-storage.js');

  await feedingStorage.addLog(e.detail);
  const logs = await this.loadLogs();
  await this.showNextFeedToast(logs[0] ?? e.detail);
    } catch (error) {
      console.error('Failed to save log:', error);
    }
  }

  private async handleLogDeleted(e: CustomEvent<string>) {
    const confirmed = await this.confirmDialog.show({
      headline: 'Delete feeding log?',
      supportingText: 'This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      confirmDestructive: true,
    });

    if (!confirmed) {
      return;
    }

    try {
      const { feedingStorage } = await import('../services/feeding-storage.js');

      await feedingStorage.deleteLog(e.detail);
      await this.loadLogs();
    } catch (error) {
      console.error('Failed to delete log:', error);
    }
  }

  private async showNextFeedToast(log?: FeedingLog) {
    if (!log || typeof log.nextFeedTime !== 'number') {
      return;
    }

    const { formatNextFeedLabel } = await import('../utils/feed-time.js');

    if (this.toastElement) {
      await this.toastElement.show({
      headline: 'Feeding saved',
      supporting: `Next feed around ${formatNextFeedLabel(log.nextFeedTime)}`,
      icon: '🕒',
      });
    }

    void this.maybeShowNextFeedNotification(log);
  }

  render() {
  const shouldShowSummary = this.hasLoadedInitialData && this.logs.length > 0;

    return html`
      <div class="container">
        ${shouldShowSummary
          ? html`
              <feeding-summary-card
                .logs=${this.logs}
                .loading=${this.loading}
              ></feeding-summary-card>
            `
          : null}
        <div class="logs-section">
          <h2 class="section-title">Recent Feedings</h2>
          ${this.loading
        ? html`<div class="loading">Loading...</div>`
        : html`
                <feeding-log-list
                  .logs=${this.logs}
                  @log-deleted=${this.handleLogDeleted}
                ></feeding-log-list>
              `}
        </div>

        <button class="add-btn" @click=${this.handleAddClick}>
          Start feeding
        </button>

        <feeding-form-dialog @log-added=${this.handleLogAdded}></feeding-form-dialog>
      </div>
      <app-toast></app-toast>
      <confirm-dialog></confirm-dialog>
    `;
  }

  private async maybeShowNextFeedNotification(log: FeedingLog) {
    if (!('Notification' in window) || typeof log.nextFeedTime !== 'number') {
      return;
    }

    let permission: NotificationPermission = Notification.permission;

    if (permission === 'default') {
      try {
        permission = await Notification.requestPermission();
      } catch (error) {
        console.warn('Requesting notification permission failed', error);
        return;
      }
    }

    if (permission !== 'granted') {
      return;
    }

    const { formatNextFeedLabel } = await import('../utils/feed-time.js');

    const notificationOptions: NotificationOptions = {
      body: `Next feed around ${formatNextFeedLabel(log.nextFeedTime)}`,
      tag: 'next-feed-reminder',
      icon: '/maskable_icon_x512.png',
      badge: '/maskable_icon_x512.png',
      data: { logId: log.id ?? null, nextFeedTime: log.nextFeedTime },
    };

    try {
      const registration = await navigator.serviceWorker?.ready;
      if (registration) {
        await registration.showNotification('Feeding saved', notificationOptions);
        return;
      }
    } catch (error) {
      console.warn('Service worker notification failed', error);
    }

    try {
      new Notification('Feeding saved', notificationOptions);
    } catch (error) {
      console.warn('Direct notification failed', error);
    }
  }
}
