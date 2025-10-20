import { LitElement, html, css, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { dialogCancelButtonStyles } from './dialog-shared-styles.js';
import { acquireScrollLock, releaseScrollLock } from '../utils/dialog-scroll-lock.js';

export interface ConfirmDialogOptions {
  headline: string;
  supportingText?: string;
  confirmText?: string;
  cancelText?: string;
  confirmDestructive?: boolean;
}

@customElement('confirm-dialog')
export class ConfirmDialog extends LitElement {
  static styles = [
    dialogCancelButtonStyles,
    css`
      :host {
        display: none;
        position: fixed;
        inset: 0;
        z-index: 1000;
      }

      :host([open]) {
        display: block;
      }

      .scrim {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        animation: fade-in 0.2s ease-out;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        overflow-y: auto;
        overscroll-behavior: contain;
      }

      .dialog {
        position: relative;
        background: var(--md-sys-color-surface-container-high);
        border-radius: var(--md-sys-shape-corner-extra-large);
        box-shadow: var(--md-sys-elevation-3);
        min-width: 280px;
        max-width: 560px;
        width: 100%;
        max-height: calc(100vh - 2rem);
        display: flex;
        flex-direction: column;
        animation: scale-in 0.2s cubic-bezier(0.2, 0, 0, 1);
        margin: auto;
        overflow-y: auto;
        overscroll-behavior: contain;
      }

      .dialog__content {
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .dialog__headline {
        color: var(--md-sys-color-on-surface);
        font-size: var(--md-sys-typescale-headline-small-font-size);
        font-weight: var(--md-sys-typescale-headline-small-font-weight);
        line-height: var(--md-sys-typescale-headline-small-line-height);
        margin: 0;
      }

      .dialog__supporting {
        color: var(--md-sys-color-on-surface-variant);
        font-size: var(--md-sys-typescale-body-medium-font-size);
        line-height: var(--md-sys-typescale-body-medium-line-height);
        margin: 0;
      }

      .dialog__button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--md-comp-button-gap);
        min-height: var(--md-comp-button-height);
        padding: 0 var(--md-comp-button-horizontal-padding);
        border-radius: var(--md-sys-shape-corner-full);
        background: transparent;
        border: none;
        font-size: var(--md-sys-typescale-label-large-font-size);
        font-weight: var(--md-sys-typescale-label-large-font-weight);
        line-height: var(--md-sys-typescale-label-large-line-height);
        letter-spacing: var(--md-sys-typescale-label-large-letter-spacing);
        cursor: pointer;
        transition:
          background-color 0.2s ease,
          color 0.2s ease,
          box-shadow 0.2s ease;
      }

      .dialog__button--confirm {
        background: var(--md-sys-color-primary);
        color: var(--md-sys-color-on-primary);
        box-shadow: var(--md-sys-elevation-1);
      }

      .dialog__button--confirm:hover,
      .dialog__button--confirm:focus-visible {
        background: var(--md-sys-color-primary-container);
        color: var(--md-sys-color-on-primary-container);
        box-shadow: var(--md-sys-elevation-2);
        outline: none;
      }

      .dialog__button--confirm.destructive {
        background: var(--md-sys-color-error);
        color: var(--md-sys-color-on-error);
        box-shadow: var(--md-sys-elevation-1);
      }

      .dialog__button--confirm.destructive:hover,
      .dialog__button--confirm.destructive:focus-visible {
        background: var(--md-sys-color-error-container);
        color: var(--md-sys-color-on-error-container);
        box-shadow: var(--md-sys-elevation-2);
      }

      .dialog__actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        padding: 0 1.5rem 1.5rem;
      }

      @keyframes fade-in {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @keyframes scale-in {
        from {
          transform: scale(0.8);
          opacity: 0;
        }
        to {
          transform: scale(1);
          opacity: 1;
        }
      }

      @media (max-width: 640px) {
        .dialog {
          max-width: calc(100vw - 2rem);
          min-width: 260px;
          max-height: calc(100vh - 1rem);
        }

        .scrim {
          padding: 0.5rem;
        }
      }
    `,
  ];

  @property({ type: Boolean, reflect: true })
  open = false;

  @state()
  private options: ConfirmDialogOptions = {
    headline: 'Confirm',
    supportingText: '',
    confirmText: 'OK',
    cancelText: 'Cancel',
    confirmDestructive: false,
  };

  private resolvePromise?: (confirmed: boolean) => void;
  private hasScrollLock = false;

  public show(options: ConfirmDialogOptions): Promise<boolean> {
    this.options = {
      headline: options.headline,
      supportingText: options.supportingText || '',
      confirmText: options.confirmText || 'OK',
      cancelText: options.cancelText || 'Cancel',
      confirmDestructive: options.confirmDestructive || false,
    };
    this.open = true;

    return new Promise<boolean>((resolve) => {
      this.resolvePromise = resolve;
    });
  }

  private handleCancel() {
    this.open = false;
    if (this.resolvePromise) {
      this.resolvePromise(false);
      this.resolvePromise = undefined;
    }
  }

  private handleConfirm() {
    this.open = false;
    if (this.resolvePromise) {
      this.resolvePromise(true);
      this.resolvePromise = undefined;
    }
  }

  private handleScrimClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      this.handleCancel();
    }
  }

  protected updated(changedProps: PropertyValues): void {
    super.updated(changedProps);
    if (changedProps.has('open')) {
      if (this.open && !this.hasScrollLock) {
        acquireScrollLock();
        this.hasScrollLock = true;
      } else if (!this.open && this.hasScrollLock) {
        releaseScrollLock();
        this.hasScrollLock = false;
      }
    }
  }

  disconnectedCallback(): void {
    if (this.hasScrollLock) {
      releaseScrollLock();
      this.hasScrollLock = false;
    }
    super.disconnectedCallback();
  }

  render() {
    return html`
      <div class="scrim" @click=${this.handleScrimClick}>
        <div class="dialog">
          <div class="dialog__content">
            <h2 class="dialog__headline">${this.options.headline}</h2>
            ${this.options.supportingText
              ? html`<p class="dialog__supporting">${this.options.supportingText}</p>`
              : null}
          </div>
          <div class="dialog__actions">
            <button
              class="dialog__button dialog__button--cancel dialog-cancel-button"
              @click=${this.handleCancel}
            >
              ${this.options.cancelText}
            </button>
            <button
              class="dialog__button dialog__button--confirm ${this.options.confirmDestructive
                ? 'destructive'
                : ''}"
              @click=${this.handleConfirm}
            >
              ${this.options.confirmText}
            </button>
          </div>
        </div>
      </div>
    `;
  }
}
