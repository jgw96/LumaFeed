import { LitElement, html, css } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { Router } from './router/router.js';

import './pages/home-page.js';
import './components/app-header-menu.js';
import './components/feeding-import-dialog.js';
import './components/pwa-install-prompt.js';

import type { HomePage } from './pages/home-page.js';

@customElement('app-root')
export class AppRoot extends LitElement {
  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
      font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI',
        Oxygen, Ubuntu, Cantarell, sans-serif;
      background-color: var(--md-sys-color-background);
      color: var(--md-sys-color-on-background);
      --bottom-nav-height: 52px;
    }

    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.5rem;
      background: var(--md-sys-color-surface);
      color: var(--md-sys-color-on-surface);
      box-shadow: var(--md-sys-elevation-2);
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: var(--md-sys-typescale-title-large-font-size);
      font-weight: var(--md-sys-typescale-title-large-font-weight);
      line-height: var(--md-sys-typescale-title-large-line-height);
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .layout {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    .content-area {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .page-container {
      flex: 1;
      padding: 0 0 calc(1.5rem + var(--bottom-nav-height));
      position: relative;
    }

    .bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      display: flex;
      background: var(--md-sys-color-surface);
      box-shadow: var(--md-sys-elevation-3);
      border-top: 1px solid var(--md-sys-color-outline-variant);
      padding: 0.25rem 0.75rem;
      min-height: var(--bottom-nav-height);
      gap: 0.5rem;
      z-index: 20;
    }

    .side-nav {
      display: none;
      flex-direction: column;
      width: 260px;
      background: var(--md-sys-color-surface);
      color: var(--md-sys-color-on-surface);
      padding: 0 1.5rem;
      border-right: none;
    }

    .side-nav__content {
      display: flex;
      flex-direction: column;
      gap: 2.5rem;
      padding: 2rem 0;
    }

    .side-nav .brand {
      font-size: 1.75rem;
      font-weight: 500;
      letter-spacing: -0.02em;
      padding: 0.5rem 0;
    }

    .side-nav .brand::before {
      box-shadow: none;
    }

    .side-nav__top {
      display: none;
    }

    .side-nav__actions {
      display: none;
    }

    .nav-links {
      display: flex;
      gap: 0.5rem;
    }

    .nav-link {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 0.35rem;
      text-decoration: none;
      color: var(--md-sys-color-on-surface-variant);
      font-size: var(--md-sys-typescale-label-medium-font-size);
      font-weight: var(--md-sys-typescale-label-medium-font-weight);
      line-height: var(--md-sys-typescale-label-medium-line-height);
      padding: 0.75rem 0.5rem;
      border-radius: var(--md-sys-shape-corner-large);
      position: relative;
      transition: background-color 0.2s ease, color 0.2s ease;
    }

    .nav-link::before {
      content: '';
      position: absolute;
      top: 0.4rem;
      width: 24px;
      height: 3px;
      border-radius: 999px;
      background: transparent;
      transition: background-color 0.2s ease;
    }

    .nav-link:hover {
      background: var(--md-sys-color-surface-container-high);
    }

    .nav-link.active {
      color: var(--md-sys-color-on-secondary-container);
      background: var(--md-sys-color-secondary-container);
    }

    .nav-icon {
      width: 24px;
      height: 24px;
      flex-shrink: 0;
      transition: all 0.2s ease;
      color: inherit;
    }

    .nav-icon path {
      fill: currentColor;
    }

    @media (min-width: 768px) {
      :host {
        --bottom-nav-height: 0px;
      }

      header {
        display: none;
      }

      .layout {
        flex-direction: row;
      }

      .side-nav {
        display: flex;
        padding: 0 1.25rem;
        box-shadow: var(--md-sys-elevation-0);
        border-right: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 50%, transparent);
      }

      .side-nav__content {
        position: sticky;
        top: 2rem;
        padding-top: 0;
        width: 100%;
      }

      .side-nav .nav-links {
        flex-direction: column;
        gap: 0.375rem;
      }

      .side-nav__top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      .side-nav .nav-link {
        flex: none;
        flex-direction: row;
        justify-content: flex-start;
        align-items: center;
        padding: 0.875rem 1.5rem 0.875rem 1.25rem;
        border-radius: 28px;
        gap: 0.875rem;
        font-size: 0.875rem;
        font-weight: 500;
        letter-spacing: 0.01em;
        position: relative;
        transition: all 0.25s cubic-bezier(0.2, 0, 0, 1);
        overflow: hidden;
        min-height: 56px;
      }

      .side-nav .nav-link::before {
        display: none;
      }

      .side-nav .nav-link::after {
        content: '';
        position: absolute;
        inset: 0;
        background: var(--md-sys-color-on-surface);
        opacity: 0;
        transition: opacity 0.2s ease;
        border-radius: inherit;
        pointer-events: none;
      }

      .side-nav .nav-link:hover {
        background: color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent);
      }

      .side-nav .nav-link:hover::after {
        opacity: 0;
      }

      .side-nav .nav-link:active::after {
        opacity: 0.12;
      }

      .side-nav .nav-link.active {
        background: var(--md-sys-color-secondary-container);
        color: var(--md-sys-color-on-secondary-container);
        font-weight: 600;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.06);
      }

      .side-nav .nav-link.active::after {
        opacity: 0;
      }

      .side-nav .nav-link.active:hover {
        background: color-mix(in srgb, var(--md-sys-color-secondary-container) 92%, var(--md-sys-color-on-secondary-container));
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.14), 0 1px 3px rgba(0, 0, 0, 0.08);
      }

      .side-nav .nav-link.active:active {
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      }

      .side-nav .nav-icon {
        width: 24px;
        height: 24px;
      }

      .side-nav__actions {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .content-area {
        flex: 1;
      }

      .bottom-nav {
        display: none;
      }

      .nav-label {
        margin-left: 0;
        font-size: inherit;
      }
    }
  `;

  @state()
  private currentRoute: string | null = null;

  @query('.page-container')
  private pageContainer?: HTMLElement;

  @query('feeding-import-dialog')
  private importDialog?: HTMLElementTagNameMap['feeding-import-dialog'];

  private readonly navItems: Array<{
    href: string;
    component: string;
    label: string;
    icon: string;
  }> = [
    { href: '/', component: 'home-page', label: 'Home', icon: 'home' },
    { href: '/settings', component: 'settings-page', label: 'Settings', icon: 'settings' },
  ];

  private router: Router;

  constructor() {
    super();
    
    this.router = new Router(
      [
        { pattern: '/', component: 'home-page' },
        {
          pattern: '/settings',
          component: 'settings-page',
          loader: () => import('./pages/settings-page.js'),
        },
      ],
      {
        notFound: {
          component: 'not-found-page',
          loader: () => import('./pages/not-found-page.js'),
        },
      }
    );

    this.router.onRouteChange((route) => {
      this.performRouteTransition(route);
    });
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('logs-imported', this.handleLogsImported);
  }

  private isActiveRoute(component: string): boolean {
    return this.currentRoute === component;
  }

  private handleNavClick(event: Event) {
    const target = event.target as HTMLElement;
    const link = target?.closest('a');

    if (link instanceof HTMLAnchorElement && link.href) {
      const url = new URL(link.href, window.location.origin);
      if (url.origin === window.location.origin) {
        event.preventDefault();
        this.router.navigate(url.pathname);
      }
    }
  }

  private performRouteTransition(route: string) {
    const updateRoute = async () => {
      this.currentRoute = route;
      await this.updateComplete;
    };

    if (this.currentRoute === null) {
      void updateRoute();
      return;
    }

    const startTransition = this.getViewTransitionStarter();

    if (!startTransition) {
      void updateRoute();
      return;
    }

    try {
      const transition = startTransition(updateRoute);
      transition?.finished?.catch(() => {});
    } catch {
      void updateRoute();
    }
  }

  disconnectedCallback(): void {
    this.removeEventListener('logs-imported', this.handleLogsImported);
    super.disconnectedCallback();
  }

  private getViewTransitionStarter():
    | ((updateCallback: () => Promise<void> | void) => { finished?: Promise<void> })
    | null {
    const container = this.pageContainer as unknown as { startViewTransition?: (cb: () => Promise<void> | void) => { finished?: Promise<void> } };

    if (container && typeof container.startViewTransition === 'function') {
      return container.startViewTransition.bind(container);
    }

    const doc = document as unknown as { startViewTransition?: (cb: () => Promise<void> | void) => { finished?: Promise<void> } };

    if (typeof doc.startViewTransition === 'function') {
      return doc.startViewTransition.bind(document);
    }

    return null;
  }

  render() {
    return html`
      <div class="layout">
        <aside class="side-nav">
          <div class="side-nav__content">
            <div class="side-nav__top">
              <div class="brand">LumaFeed</div>
              <div class="side-nav__actions">
                <app-header-menu @import-feeds=${this.handleImportFeedsRequested}></app-header-menu>
              </div>
            </div>
            <nav class="nav-links" aria-label="Primary navigation" @click=${this.handleNavClick}>
              ${this.renderNavLinks()}
            </nav>
          </div>
        </aside>
        <div class="content-area">
          <header>
            <div class="brand">
              <img src="/feedings-65.png" alt="LumaFeed" width="24" height="24" />

              <span>LumaFeed</span>
            </div>
            <div class="header-actions">
              <app-header-menu @import-feeds=${this.handleImportFeedsRequested}></app-header-menu>
            </div>
          </header>
          <main class="page-container" style="view-transition-name: page-content;">
            ${this.renderCurrentPage()}
          </main>
        </div>
      </div>
      <nav class="bottom-nav nav-links" aria-label="Primary navigation" @click=${this.handleNavClick}>
        ${this.renderNavLinks()}
      </nav>
      <feeding-import-dialog></feeding-import-dialog>
      <pwa-install-prompt></pwa-install-prompt>
    `;
  }

  private getIconSvg(iconName: string, active: boolean) {
    const icons: Record<string, { filled: string; outlined: string }> = {
      home: {
        outlined: 'M12 5.69l5 4.5V18h-2v-6H9v6H7v-7.81l5-4.5M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z',
        filled: 'M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3zm0 2.69l5 4.5V18h-2v-6H9v6H7v-7.81l5-4.5z'
      },
      settings: {
        outlined: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z',
        filled: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z'
      }
    };

    const icon = icons[iconName];
    if (!icon) return html``;

    const path = active ? icon.filled : icon.outlined;
    
    return html`
      <svg class="nav-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" fill="currentColor">
        <path d="${path}"></path>
      </svg>
    `;
  }

  private renderNavLinks() {
    return this.navItems.map(({ href, component, label, icon }) => {
      const active = this.isActiveRoute(component);
      return html`
        <a
          href=${href}
          class="nav-link ${active ? 'active' : ''}"
          aria-current=${active ? 'page' : 'false'}
        >
          ${this.getIconSvg(icon, active)}
          <span class="nav-label">${label}</span>
        </a>
      `;
    });
  }

  private handleLogsImported = (event: Event) => {
    if (this.currentRoute === 'home-page') {
      const homePage = this.renderRoot.querySelector('home-page') as HomePage | null;
      if (homePage?.refreshLogs) {
        void homePage.refreshLogs();
      }
    }

    event.stopPropagation();
  };

  private handleImportFeedsRequested = () => {
    this.importDialog?.open();
  };

  private renderCurrentPage() {
    switch (this.currentRoute) {
      case 'home-page':
        return html`<home-page></home-page>`;
      case 'settings-page':
        return html`<settings-page></settings-page>`;
      case 'not-found-page':
      default:
        return html`<not-found-page></not-found-page>`;
    }
  }
}
