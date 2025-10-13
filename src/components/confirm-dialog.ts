import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

export interface ConfirmDialogOptions {
  headline: string;
  supportingText?: string;
  confirmText?: string;
  cancelText?: string;
  confirmDestructive?: boolean;
}

@customElement('confirm-dialog')
export class ConfirmDialog extends LitElement {
  static styles = css`
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
    }

    .dialog {
      position: relative;
      background: var(--md-sys-color-surface-container-high);
      border-radius: var(--md-sys-shape-corner-extra-large);
      box-shadow: var(--md-sys-elevation-3);
      min-width: 280px;
      max-width: 560px;
      width: 100%;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      animation: scale-in 0.2s cubic-bezier(0.2, 0, 0, 1);
      margin: auto;
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

    .dialog__actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      padding: 0 1.5rem 1.5rem;
    }

    .dialog__button {
      background: transparent;
      border: none;
      padding: 0.625rem 1.5rem;
      border-radius: var(--md-sys-shape-corner-full);
      font-size: var(--md-sys-typescale-label-large-font-size);
      font-weight: var(--md-sys-typescale-label-large-font-weight);
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .dialog__button--cancel {
      color: var(--md-sys-color-primary);
    }

    .dialog__button--cancel:hover {
      background-color: var(--md-sys-color-primary-container);
    }

    .dialog__button--confirm {
      color: var(--md-sys-color-primary);
    }

    .dialog__button--confirm:hover {
      background-color: var(--md-sys-color-primary-container);
    }

    .dialog__button--confirm.destructive {
      color: var(--md-sys-color-error);
    }

    .dialog__button--confirm.destructive:hover {
      background-color: var(--md-sys-color-error-container);
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
      }

      .scrim {
        padding: 0.5rem;
      }
    }
  `;

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
              class="dialog__button dialog__button--cancel"
              @click=${this.handleCancel}
            >
              ${this.options.cancelText}
            </button>
            <button
              class="dialog__button dialog__button--confirm ${this.options.confirmDestructive ? 'destructive' : ''}"
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
