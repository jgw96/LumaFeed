import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

type UpdateServiceWorker = (reloadPage?: boolean) => Promise<void>;

@customElement('pwa-update-dialog')
export class PWAUpdateDialog extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .prompt {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: var(--md-sys-color-surface);
      color: var(--md-sys-color-on-surface);
      border-radius: var(--md-sys-shape-corner-large) var(--md-sys-shape-corner-large) 0 0;
      padding: 1rem;
      box-shadow: var(--md-sys-elevation-4);
      z-index: 1000;
      transform: translateY(100%);
      opacity: 0;
      transition:
        transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
        opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    @media (min-width: 768px) {
      .prompt {
        top: 1rem;
        bottom: unset;
        left: unset;
        right: 1rem;
        transform: translateX(-50%) translateY(calc(100% + 2rem));
        max-width: 400px;
        border-radius: var(--md-sys-shape-corner-extra-large);
        box-shadow: var(--md-sys-elevation-5);
      }

      .prompt--visible {
        transform: translateX(-50%) translateY(0);
      }
    }

    .prompt--visible {
      transform: translateY(0);
      opacity: 1;
    }

    .prompt__header {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }

    .prompt__icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: var(--md-sys-color-primary-container);
      color: var(--md-sys-color-on-primary-container);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      flex-shrink: 0;
    }

    .prompt__icon img {
      width: 100%;
      height: 100%;
      border-radius: 12px;
      object-fit: cover;
    }

    .prompt__text {
      flex: 1;
      min-width: 0;
    }

    .prompt__title {
      font-size: var(--md-sys-typescale-title-medium-font-size);
      font-weight: var(--md-sys-typescale-title-medium-font-weight);
      line-height: var(--md-sys-typescale-title-medium-line-height);
      margin: 0 0 0.25rem 0;
    }

    .prompt__description {
      font-size: var(--md-sys-typescale-body-small-font-size);
      line-height: var(--md-sys-typescale-body-small-line-height);
      color: var(--md-sys-color-on-surface-variant);
      margin: 0;
    }

    .prompt__actions {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
    }

    .prompt__button {
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
        box-shadow 0.2s ease;
    }

    .prompt__button--text {
      background: transparent;
      color: var(--md-sys-color-primary);
    }

    .prompt__button--text:hover,
    .prompt__button--text:focus-visible {
      background: color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent);
      outline: none;
    }

    .prompt__button--filled {
      background: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-primary);
      box-shadow: var(--md-sys-elevation-1);
    }

    .prompt__button--filled:hover,
    .prompt__button--filled:focus-visible {
      background: var(--md-sys-color-primary-container);
      color: var(--md-sys-color-on-primary-container);
      box-shadow: var(--md-sys-elevation-2);
      outline: none;
    }
  `;

  @property({ type: Boolean })
  open = false;

  @property({ attribute: false })
  updateServiceWorker: UpdateServiceWorker | null = null;

  private readonly appName = 'LumaFeed';
  private readonly appIcon = '/maskable_icon_x128.png';

  private dismiss = () => {
    this.dispatchEvent(
      new CustomEvent('pwa-update-dismissed', { bubbles: true, composed: true })
    );
  };

  private async applyUpdate() {
    if (!this.updateServiceWorker) {
      return;
    }

    try {
      await this.updateServiceWorker(true);
      this.dispatchEvent(
        new CustomEvent('pwa-update-applied', { bubbles: true, composed: true })
      );
    } catch (error) {
      console.warn('Service worker update failed', error);
    }
  }

  render() {
    if (!this.open || !this.updateServiceWorker) {
      return null;
    }

    return html`
      <div class="prompt prompt--visible" role="dialog" aria-modal="true" aria-live="assertive">
        <div class="prompt__header">
          <div class="prompt__icon">
            <img src="${this.appIcon}" alt="${this.appName}" />
          </div>
          <div class="prompt__text">
            <h3 class="prompt__title">Update available</h3>
            <p class="prompt__description">
              A newer version of ${this.appName} is ready. Refresh now to get the latest fixes and
              features.
            </p>
          </div>
        </div>
        <div class="prompt__actions">
          <button class="prompt__button prompt__button--text" @click=${this.dismiss}>Later</button>
          <button class="prompt__button prompt__button--filled" @click=${this.applyUpdate}>
            Refresh
          </button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pwa-update-dialog': PWAUpdateDialog;
  }
}
