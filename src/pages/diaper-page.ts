import { LitElement, html, css } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';

import type { DiaperLog } from '../types/diaper-log.js';

import '../components/app-toast.js';
import '../components/diaper-log-list.js';
import '../components/diaper-summary-card.js';

import type { DiaperFormDialog } from '../components/diaper-form-dialog.js';
import type { AppToast } from '../components/app-toast.js';
import type { ConfirmDialog } from '../components/confirm-dialog.js';

@customElement('diaper-page')
export class DiaperPage extends LitElement {
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

    .section-title {
      color: var(--md-sys-color-on-surface);
      font-size: var(--md-sys-typescale-title-large-font-size);
      font-weight: var(--md-sys-typescale-title-large-font-weight);
      line-height: var(--md-sys-typescale-title-large-line-height);
      margin-bottom: 1rem;
    }

    .logs-section {
      display: grid;
      gap: 1.5rem;
    }

    .add-btn {
      position: fixed;
      right: 16px;
      bottom: calc(45px + var(--bottom-nav-height, 0px));
      z-index: 30;

      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--md-comp-fab-gap);
      min-height: var(--md-comp-fab-height);
      padding: 0 var(--md-comp-fab-horizontal-padding);
      border: none;
      border-radius: var(--md-comp-fab-shape);
      background: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-primary);
      font-size: var(--md-sys-typescale-label-large-font-size);
      font-weight: var(--md-sys-typescale-label-large-font-weight);
      line-height: var(--md-sys-typescale-label-large-line-height);
      letter-spacing: var(--md-sys-typescale-label-large-letter-spacing);
      cursor: pointer;
      box-shadow: var(--md-sys-elevation-3);
      transition:
        background-color 0.2s ease,
        box-shadow 0.2s ease,
        color 0.2s ease,
        transform 0.2s ease;
    }

    .add-btn:hover,
    .add-btn:focus-visible {
      background: var(--md-sys-color-primary-container);
      color: var(--md-sys-color-on-primary-container);
      box-shadow: var(--md-sys-elevation-4);
      transform: translateY(-2px);
      outline: none;
    }

    .add-btn:active {
      transform: translateY(0);
      box-shadow: var(--md-sys-elevation-3);
    }

    .add-btn::before {
      content: '+';
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: var(--md-comp-fab-icon-size);
      height: var(--md-comp-fab-icon-size);
      font-size: 1.5rem;
      line-height: 1;
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
  `;

  @state()
  private logs: DiaperLog[] = [];

  @state()
  private loading = false;

  @state()
  private hasLoadedInitialData = false;

  @query('diaper-form-dialog')
  private dialog?: DiaperFormDialog;

  @query('confirm-dialog')
  private confirmDialog?: ConfirmDialog;

  @query('app-toast')
  private toastElement?: AppToast;

  private formDialogLoaded = false;
  private confirmDialogLoaded = false;

  connectedCallback(): void {
    super.connectedCallback();
    void this.loadLogs();
  }

  private async loadLogs(): Promise<DiaperLog[]> {
    this.loading = true;
    try {
      const { diaperStorage } = await import('../services/diaper-storage.js');
      this.logs = await diaperStorage.loadLogs();
    } catch (error) {
      console.error('Failed to load diaper logs:', error);
    } finally {
      this.loading = false;
      this.hasLoadedInitialData = true;
    }

    return this.logs;
  }

  public async refreshLogs(): Promise<void> {
    await this.loadLogs();
  }

  private async ensureDiaperDialog(): Promise<void> {
    await this.updateComplete;

    if (!this.formDialogLoaded) {
      if (!customElements.get('diaper-form-dialog')) {
        await import('../components/diaper-form-dialog.js');
      }

      await customElements.whenDefined('diaper-form-dialog');
      this.formDialogLoaded = true;
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
    await this.ensureDiaperDialog();
    this.dialog?.open();
  }

  private async handleLogAdded(event: CustomEvent<DiaperLog>) {
    try {
      const { diaperStorage } = await import('../services/diaper-storage.js');
      await diaperStorage.addLog(event.detail);
      await this.loadLogs();
      await this.toastElement?.show({
        headline: 'Diaper logged',
        supporting: this.buildToastSupportingText(event.detail),
        icon: '🧷',
      });
    } catch (error) {
      console.error('Failed to save diaper log:', error);
    }
  }

  private buildToastSupportingText(log: DiaperLog): string {
    const parts: string[] = [];
    if (log.wet) {
      parts.push('pee');
    }
    if (log.dirty) {
      parts.push('poop');
    }
    const typeText = parts.length ? parts.join(' + ') : 'diaper';
    const time = new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    }).format(log.timestamp);
    return `${typeText} diaper at ${time}`;
  }

  private async handleLogDeleted(event: CustomEvent<string>) {
    await this.ensureConfirmDialog();

    if (!this.confirmDialog) {
      return;
    }

    const confirmed = await this.confirmDialog.show({
      headline: 'Delete diaper log?',
      supportingText: 'This removes the entry from your diaper history.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      confirmDestructive: true,
    });

    if (!confirmed) {
      return;
    }

    try {
      const { diaperStorage } = await import('../services/diaper-storage.js');
      await diaperStorage.deleteLog(event.detail);
      await this.loadLogs();
      await this.toastElement?.show({
        headline: 'Diaper removed',
        supporting: 'The log has been deleted.',
        icon: '🗑️',
      });
    } catch (error) {
      console.error('Failed to delete diaper log:', error);
    }
  }

  render() {
    const shouldShowSummary = this.hasLoadedInitialData && this.logs.length > 0;

    return html`
      <div class="container">
        ${shouldShowSummary
          ? html`
              <diaper-summary-card
                .logs=${this.logs}
                .loading=${this.loading}
              ></diaper-summary-card>
            `
          : null}
        <div class="logs-section">
          <h2 class="section-title">Recent Diapers</h2>
          ${this.loading
            ? html`
                <div class="logs-skeleton" role="status" aria-live="polite" aria-busy="true">
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
                </div>
              `
            : html`
                <diaper-log-list
                  .logs=${this.logs}
                  @log-add-requested=${this.handleAddClick}
                  @log-deleted=${this.handleLogDeleted}
                ></diaper-log-list>
              `}
        </div>

        <button class="add-btn" @click=${this.handleAddClick}>Log diaper</button>

        <diaper-form-dialog @log-added=${this.handleLogAdded}></diaper-form-dialog>
      </div>
      <app-toast></app-toast>
      <confirm-dialog></confirm-dialog>
    `;
  }
}
