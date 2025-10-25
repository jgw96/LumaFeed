import { html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { authService, isWebAuthnSupported } from '../services/auth-service.js';
import { BaseModalDialog } from './base-modal-dialog.js';
import { dialogCancelButtonStyles, dialogHeaderStyles } from './dialog-shared-styles.js';

export type AuthDialogMode = 'register' | 'authenticate';

@customElement('auth-dialog')
export class AuthDialog extends BaseModalDialog {
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
        box-sizing: border-box;
        max-height: calc(100vh - 2rem);
        overflow: auto;
        overscroll-behavior: contain;
      }

      dialog::backdrop {
        background: rgba(0, 0, 0, 0.32);
        backdrop-filter: blur(24px);
      }

      .dialog-content {
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .dialog-actions {
        display: flex;
        gap: 0.75rem;
        justify-content: flex-end;
        padding: 0 1.5rem 1.5rem;
      }

      .dialog-actions--center {
        justify-content: center;
      }

      .btn-confirm {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--md-comp-button-gap);
        min-height: var(--md-comp-button-height);
        padding: 0 var(--md-comp-button-horizontal-padding);
        border-radius: var(--md-sys-shape-corner-full);
        background: var(--md-sys-color-primary);
        color: var(--md-sys-color-on-primary);
        box-shadow: var(--md-sys-elevation-1);
        border: none;
        font-size: var(--md-sys-typescale-label-large-font-size);
        font-weight: var(--md-sys-typescale-label-large-font-weight);
        line-height: var(--md-sys-typescale-label-large-line-height);
        letter-spacing: var(--md-sys-typescale-label-large-letter-spacing);
        cursor: pointer;
        transition:
          background-color 0.2s ease,
          box-shadow 0.2s ease;
      }

      .btn-confirm:hover:not(:disabled),
      .btn-confirm:focus-visible {
        background: color-mix(in srgb, var(--md-sys-color-primary) 92%, white);
        box-shadow: var(--md-sys-elevation-2);
        outline: none;
      }

      .btn-confirm:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        box-shadow: none;
      }

      .intro {
        display: grid;
        gap: 0.75rem;
      }

      .intro__icon {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--md-sys-shape-corner-large);
        background: var(--md-sys-color-primary-container);
        color: var(--md-sys-color-on-primary-container);
        font-size: 24px;
        margin: 0 auto;
      }

      .intro__title {
        font-size: var(--md-sys-typescale-headline-small-font-size);
        font-weight: var(--md-sys-typescale-headline-small-font-weight);
        line-height: var(--md-sys-typescale-headline-small-line-height);
        color: var(--md-sys-color-on-surface);
        margin: 0;
        text-align: center;
      }

      .intro__description {
        font-size: var(--md-sys-typescale-body-medium-font-size);
        color: var(--md-sys-color-on-surface-variant);
        line-height: 1.5;
        margin: 0;
        text-align: center;
      }

      .error {
        padding: 0.75rem 1rem;
        border-radius: var(--md-sys-shape-corner-medium);
        background: var(--md-sys-color-error-container);
        color: var(--md-sys-color-on-error-container);
        font-size: var(--md-sys-typescale-body-small-font-size);
        line-height: 1.4;
      }

      .warning {
        padding: 0.75rem 1rem;
        border-radius: var(--md-sys-shape-corner-medium);
        background: color-mix(in srgb, var(--md-sys-color-tertiary-container) 60%, transparent);
        color: var(--md-sys-color-on-tertiary-container);
        font-size: var(--md-sys-typescale-body-small-font-size);
        line-height: 1.4;
      }
    `,
  ];

  @state()
  private mode: AuthDialogMode = 'authenticate';

  @state()
  private error = '';

  @state()
  private loading = false;

  /**
   * Show the dialog in authentication mode
   */
  showAuthenticate(): void {
    this.mode = 'authenticate';
    this.open();
  }

  /**
   * Show the dialog in registration mode
   */
  showRegister(): void {
    this.mode = 'register';
    this.open();
  }

  protected resetDialogState(): void {
    this.error = '';
    this.loading = false;
  }

  private async handleRegister(e: Event): Promise<void> {
    e.preventDefault();
    this.loading = true;
    this.error = '';

    try {
      // Auto-generate email and display name for biometric-only flow
      const email = `user-${Date.now()}@lumafeed.local`;
      const displayName = `LumaFeed User`;
      await authService.register(email, displayName);
      this.close();
      this.dispatchEvent(
        new CustomEvent('auth-registered', {
          bubbles: true,
          composed: true,
        })
      );
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Registration failed';
    } finally {
      this.loading = false;
    }
  }

  private async handleAuthenticate(e: Event): Promise<void> {
    e.preventDefault();
    this.loading = true;
    this.error = '';

    try {
      await authService.authenticate();
      this.close();
      this.dispatchEvent(
        new CustomEvent('auth-success', {
          bubbles: true,
          composed: true,
        })
      );
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Authentication failed';
    } finally {
      this.loading = false;
    }
  }

  private handleCancel(): void {
    this.close();
  }

  render() {
    const isRegisterMode = this.mode === 'register';

    return html`
      <dialog>
        <div class="dialog-header">
          <h2>${isRegisterMode ? 'Secure Your Data' : 'Verify Your Identity'}</h2>
          <p class="subtitle">
            ${isRegisterMode
              ? 'Use biometric authentication to protect your feeding and diaper logs.'
              : 'Use your biometric authentication to access your logs.'}
          </p>
        </div>

        <div class="dialog-content">
          <div class="intro">
            <div class="intro__icon">🔐</div>
            <p class="intro__description">
              ${isRegisterMode
                ? 'Your device will securely store this credential locally. No data is sent to any server.'
                : 'Authenticate to continue viewing your logs.'}
            </p>
          </div>

          ${!isWebAuthnSupported()
            ? html`
                <div class="warning">
                  ⚠️ WebAuthn is not supported in this browser. Please use a modern browser with
                  biometric authentication support.
                </div>
              `
            : ''}
          ${this.error ? html`<div class="error">${this.error}</div>` : ''}
        </div>

        <div class="dialog-actions ${isRegisterMode ? '' : 'dialog-actions--center'}">
          ${isRegisterMode
            ? html`
                <button
                  type="button"
                  class="dialog-cancel-button"
                  @click=${this.handleCancel}
                  ?disabled=${this.loading}
                >
                  Cancel
                </button>
              `
            : ''}
          <button
            type="button"
            class="btn-confirm"
            @click=${isRegisterMode ? this.handleRegister : this.handleAuthenticate}
            ?disabled=${this.loading || !isWebAuthnSupported()}
          >
            ${this.loading
              ? 'Processing...'
              : isRegisterMode
                ? 'Register Biometric'
                : 'Authenticate'}
          </button>
        </div>
      </dialog>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'auth-dialog': AuthDialog;
  }
}
