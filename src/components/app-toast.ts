import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';

export interface ToastContent {
  headline: string;
  supporting: string;
  icon?: string;
}

@customElement('app-toast')
export class AppToast extends LitElement {
  static styles = css`
    :host {
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

    :host(.toast--visible) {
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
  `;

  @state()
  private content: ToastContent | null = null;

  @state()
  private visible = false;

  private hideDelay = 5000;
  private hideTimeoutId: number | null = null;
  private clearTimeoutId: number | null = null;

  constructor() {
    super();
    this.classList.add('toast');
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute('role', 'status');
    this.setAttribute('aria-live', 'polite');
    this.setAttribute('aria-atomic', 'true');
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.reset();
  }

  render() {
    if (!this.content) {
      return null;
    }

    return html`
      ${this.content.icon
        ? html`<span class="toast__icon" aria-hidden="true">${this.content.icon}</span>`
        : null}
      <div class="toast__content">
        <span class="toast__headline">${this.content.headline}</span>
        <span class="toast__supporting">${this.content.supporting}</span>
      </div>
    `;
  }

  public show(toast: ToastContent) {
    this.clearTimers();
    this.content = toast;
    this.visible = true;
    this.updateVisibilityClass();

    this.hideTimeoutId = window.setTimeout(() => {
      this.visible = false;
      this.updateVisibilityClass();
      this.hideTimeoutId = null;

      this.clearTimeoutId = window.setTimeout(() => {
        this.content = null;
        this.clearTimeoutId = null;
      }, 300);
    }, this.hideDelay);
  }

  public hide() {
    this.clearTimers();
    this.visible = false;
    this.content = null;
    this.updateVisibilityClass();
  }

  public reset() {
    this.hide();
  }

  private clearTimers() {
    if (this.hideTimeoutId !== null) {
      window.clearTimeout(this.hideTimeoutId);
      this.hideTimeoutId = null;
    }

    if (this.clearTimeoutId !== null) {
      window.clearTimeout(this.clearTimeoutId);
      this.clearTimeoutId = null;
    }
  }

  private updateVisibilityClass() {
    this.classList.toggle('toast--visible', this.visible);
  }
}
