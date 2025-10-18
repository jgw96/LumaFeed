import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import '../types/pwa-install.d.js';

/**
 * Lightweight PWA install prompt component
 * Handles beforeinstallprompt event and shows a Material 3 styled prompt
 */
@customElement('pwa-install-prompt')
export class PWAInstallPrompt extends LitElement {
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
      border-radius: 16px 16px 0 0;
      padding: 1rem;
      box-shadow:
        0 -4px 16px rgba(0, 0, 0, 0.2),
        0 -2px 8px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      transform: translateY(100%);
      opacity: 0;
      transition:
        transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
        opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* Desktop: center it with max-width */
    @media (min-width: 768px) {
      .prompt {
        top: 1rem;
        bottom: unset;
        left: unset;
        right: 1rem;
        transform: translateX(-50%) translateY(calc(100% + 2rem));
        max-width: 400px;
        border-radius: 16px;
        box-shadow:
          0 8px 16px rgba(0, 0, 0, 0.2),
          0 4px 8px rgba(0, 0, 0, 0.1);
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

    .prompt__close {
      background: none;
      border: none;
      color: var(--md-sys-color-on-surface-variant);
      cursor: pointer;
      padding: 0.25rem;
      margin: -0.25rem -0.25rem 0 0;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s ease;
    }

    .prompt__close:hover {
      background: var(--md-sys-color-surface-variant);
    }

    .prompt__actions {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
    }

    .prompt__button {
      padding: 0.625rem 1.5rem;
      border: none;
      border-radius: 20px;
      font-size: var(--md-sys-typescale-label-large-font-size);
      font-weight: var(--md-sys-typescale-label-large-font-weight);
      line-height: var(--md-sys-typescale-label-large-line-height);
      cursor: pointer;
      transition:
        background-color 0.2s ease,
        box-shadow 0.2s ease;
    }

    .prompt__button--text {
      background: transparent;
      color: var(--md-sys-color-primary);
    }

    .prompt__button--text:hover {
      background: color-mix(in srgb, var(--md-sys-color-primary) 8%, transparent);
    }

    .prompt__button--filled {
      background: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-primary);
    }

    .prompt__button--filled:hover {
      box-shadow:
        0 1px 3px rgba(0, 0, 0, 0.12),
        0 1px 2px rgba(0, 0, 0, 0.24);
    }

    @media (prefers-color-scheme: dark) {
      .prompt {
        box-shadow:
          0 -4px 16px rgba(0, 0, 0, 0.4),
          0 -2px 8px rgba(0, 0, 0, 0.3);
      }

      @media (min-width: 768px) {
        .prompt {
          box-shadow:
            0 8px 16px rgba(0, 0, 0, 0.4),
            0 4px 8px rgba(0, 0, 0, 0.3);
        }
      }
    }

    /* iOS-specific styles for Safari */
    @supports (-webkit-touch-callout: none) {
      .ios-prompt {
        background: var(--md-sys-color-surface-container-high);
        padding: 1.25rem;
      }

      .ios-instructions {
        margin-top: 1rem;
        padding: 1rem;
        background: var(--md-sys-color-surface-container);
        border-radius: 12px;
      }

      .ios-instructions__title {
        font-size: var(--md-sys-typescale-title-small-font-size);
        font-weight: var(--md-sys-typescale-title-small-font-weight);
        margin: 0 0 0.75rem 0;
      }

      .ios-instructions__steps {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .ios-instructions__step {
        font-size: var(--md-sys-typescale-body-small-font-size);
        line-height: var(--md-sys-typescale-body-small-line-height);
        color: var(--md-sys-color-on-surface-variant);
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .ios-instructions__step::before {
        content: '→';
        color: var(--md-sys-color-primary);
        font-weight: bold;
      }
    }
  `;

  @state() private visible = false;
  @state() private deferredPrompt: BeforeInstallPromptEvent | null = null;
  @state() private isIOS = false;
  @state() private isStandalone = false;
  @state() private appName = 'LumaFeed';
  @state() private appIcon = '/maskable_icon_x128.png';

  connectedCallback() {
    super.connectedCallback();
    this.checkPlatform();
    this.checkInstallability();
  }

  private checkPlatform() {
    // Check if iOS
    const isIOSDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.userAgent.includes('Mac') && 'ontouchend' in document);
    this.isIOS = isIOSDevice;

    // Check if already installed/standalone
    this.isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;
  }

  private checkInstallability() {
    // Don't show if already installed
    if (this.isStandalone) {
      return;
    }

    // Check if user has previously dismissed
    const dismissed = sessionStorage.getItem('pwa-install-dismissed');
    if (dismissed === 'true') {
      return;
    }

    if (this.isIOS) {
      // For iOS, show instructions after a delay
      setTimeout(() => {
        this.visible = true;
      }, 3000);
    } else {
      // For Chrome/Edge, listen for beforeinstallprompt
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        this.deferredPrompt = e as BeforeInstallPromptEvent;
        // Show prompt after a short delay
        setTimeout(() => {
          this.visible = true;
        }, 2000);
      });
    }
  }

  private async handleInstall() {
    if (!this.deferredPrompt) {
      return;
    }

    // Show the install prompt
    this.deferredPrompt.prompt();

    // Wait for the user's response
    const { outcome } = await this.deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('PWA installed');
    }

    // Clear the deferred prompt
    this.deferredPrompt = null;
    this.hide();
  }

  private hide() {
    this.visible = false;
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  }

  render() {
    if (!this.visible) {
      return null;
    }

    if (this.isIOS) {
      return html`
        <div class="prompt prompt--visible ios-prompt">
          <div class="prompt__header">
            <div class="prompt__icon">
              <img src="${this.appIcon}" alt="${this.appName}" />
            </div>
            <div class="prompt__text">
              <h3 class="prompt__title">Install ${this.appName}</h3>
              <p class="prompt__description">Get quick access from your home screen</p>
            </div>
            <button class="prompt__close" @click="${this.hide}" aria-label="Dismiss">✕</button>
          </div>
          <div class="ios-instructions">
            <h4 class="ios-instructions__title">To install:</h4>
            <ol class="ios-instructions__steps">
              <li class="ios-instructions__step">
                Tap the Share button
                <svg width="16" height="20" viewBox="0 0 16 20" fill="currentColor">
                  <path d="M8 0L4 4h2.5v6h3V4H12L8 0zm-7 16v2h14v-2H1z" />
                </svg>
              </li>
              <li class="ios-instructions__step">Scroll down and tap "Add to Home Screen"</li>
            </ol>
          </div>
        </div>
      `;
    }

    return html`
      <div class="prompt prompt--visible">
        <div class="prompt__header">
          <div class="prompt__icon">
            <img src="${this.appIcon}" alt="${this.appName}" />
          </div>
          <div class="prompt__text">
            <h3 class="prompt__title">Install ${this.appName}</h3>
            <p class="prompt__description">
              Install the app for easy access from your home screen, taskbar or app drawer.
            </p>
          </div>
          <button class="prompt__close" @click="${this.hide}" aria-label="Dismiss">✕</button>
        </div>
        <div class="prompt__actions">
          <button class="prompt__button prompt__button--text" @click="${this.hide}">Not now</button>
          <button class="prompt__button prompt__button--filled" @click="${this.handleInstall}">
            Install
          </button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pwa-install-prompt': PWAInstallPrompt;
  }
}
