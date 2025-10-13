import { LitElement, html, css } from 'lit';
import { customElement, query } from 'lit/decorators.js';

@customElement('app-header-menu')
export class AppHeaderMenu extends LitElement {
  static styles = css`
    :host {
      display: contents;
    }

    .menu-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: none;
      background: transparent;
      color: var(--md-sys-color-on-surface-variant);
      cursor: pointer;
      transition: background-color 0.2s ease, color 0.2s ease;
      font-size: 1.75rem;
      line-height: 1;
    }

    .menu-btn:hover,
    .menu-btn:focus-visible {
      background: var(--md-sys-color-surface-container);
      color: var(--md-sys-color-on-surface);
      outline: none;
    }

    .menu-btn:active {
      background: var(--md-sys-color-surface-container-high);
    }

    .header-menu {
      min-width: 180px;
      padding: 0.75rem;
      display: grid;
      gap: 0.5rem;
      border-radius: var(--md-sys-shape-corner-medium);
      border: 1px solid var(--md-sys-color-outline-variant);
      box-shadow: var(--md-sys-elevation-3);
      background: var(--md-sys-color-surface-container-highest);
      color: var(--md-sys-color-on-surface);
      position: fixed;
      top: 72px;
      right: 1.5rem;
      margin: 0;
      opacity: 0;
      pointer-events: none;
      transform: translateY(-6px) scale(0.98);
      transition: opacity 150ms ease, transform 150ms ease;
    }

    .header-menu:where(:popover-open) {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0) scale(1);
    }

    .header-menu__button {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: none;
      border-radius: var(--md-sys-shape-corner-small);
      background: transparent;
      color: inherit;
      font: inherit;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .header-menu__button:hover,
    .header-menu__button:focus-visible {
      background: var(--md-sys-color-surface-container);
      outline: none;
    }
  `;

  private readonly menuId = `app-header-menu-${Math.random().toString(36).slice(2)}`;

  @query('[data-menu-trigger]')
  private trigger?: HTMLButtonElement;

  @query('[data-menu]')
  private menu?: HTMLDivElement;

  firstUpdated(): void {
    this.menu?.addEventListener('beforetoggle', this.handleMenuBeforeToggle);
    this.menu?.addEventListener('toggle', this.handleMenuToggle);
  }

  disconnectedCallback(): void {
    this.menu?.removeEventListener('beforetoggle', this.handleMenuBeforeToggle);
    this.menu?.removeEventListener('toggle', this.handleMenuToggle);
    super.disconnectedCallback();
  }

  render() {
    return html`
      <button
        class="menu-btn"
        type="button"
        aria-label="Open menu"
        aria-haspopup="menu"
        aria-expanded="false"
        data-menu-trigger
        aria-controls=${this.menuId}
        popovertarget=${this.menuId}
      >
        &#8942;
      </button>
      <div
        id=${this.menuId}
        class="header-menu"
        popover="auto"
        role="menu"
        data-menu
      >
        <button
          class="header-menu__button"
          type="button"
          role="menuitem"
          @click=${this.handleImportFeedsClick}
        >
          Import feeds
        </button>
      </div>
    `;
  }

  private handleImportFeedsClick = () => {
    this.closeMenu();
    this.dispatchEvent(
      new CustomEvent('import-feeds', {
        bubbles: true,
        composed: true,
      })
    );
  };

  private handleMenuToggle = (event: Event) => {
    const popover = event.target as HTMLDivElement | null;
    if (!popover) {
      return;
    }

    const toggleEvent = event as Event & { newState?: 'open' | 'closed' };
    const isOpen = toggleEvent.newState
      ? toggleEvent.newState === 'open'
      : popover.matches(':popover-open');

    this.trigger?.setAttribute('aria-expanded', String(isOpen));
  };

  private handleMenuBeforeToggle = (event: Event) => {
    const popover = event.target as HTMLDivElement | null;
    if (!popover || !this.trigger) {
      return;
    }

    const toggleEvent = event as Event & { newState?: 'open' | 'closed' };
    const isOpening = toggleEvent.newState
      ? toggleEvent.newState === 'open'
      : !popover.matches(':popover-open');

    if (isOpening) {
      this.positionMenu(popover);
    }
  };

  private positionMenu(popover: HTMLDivElement) {
    if (!this.trigger) {
      return;
    }

    const anchorRect = this.trigger.getBoundingClientRect();
    const spacing = 8;
    const minRight = 16;
    const rightOffset = Math.max(window.innerWidth - anchorRect.right, minRight);

    popover.style.position = 'fixed';
    popover.style.top = `${anchorRect.bottom + spacing}px`;
    popover.style.left = 'auto';
    popover.style.right = `${rightOffset}px`;
  }

  private closeMenu() {
    this.menu?.hidePopover?.();
  }
}