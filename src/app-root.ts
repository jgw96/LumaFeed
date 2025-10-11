import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { Router } from './router/router.js';
import './pages/home-page.js';
import './pages/settings-page.js';
import './pages/not-found-page.js';

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

    .brand::before {
      content: '';
      width: 36px;
      height: 36px;
      border-radius: 12px;
      background: var(--md-sys-color-secondary-container);
      box-shadow: var(--md-sys-elevation-2);
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

    main {
      flex: 1;
      padding: 0 0 calc(1.5rem + var(--bottom-nav-height));
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
      background: var(--md-sys-color-surface-container);
      color: var(--md-sys-color-on-surface);
      padding: 2rem 1.5rem;
      gap: 1rem;
      border-right: none;
    }

    .side-nav .brand::before {
      box-shadow: none;
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

    .nav-link.active::before {
      background: var(--md-sys-color-on-secondary-container);
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
        position: sticky;
        top: 0;
        height: 100vh;
        padding: 2.5rem 1.75rem;
        border-right: 1px solid var(--md-sys-color-outline-variant);
        box-shadow: var(--md-sys-elevation-2);
      }

      .side-nav .nav-links {
        flex-direction: column;
        gap: 0.25rem;
      }

      .side-nav .nav-link {
        flex: none;
        flex-direction: row;
        justify-content: flex-start;
        align-items: center;
        padding: 0.75rem 1rem;
      }

      .side-nav .nav-link::before {
        width: 4px;
        height: 70%;
        top: 15%;
        left: 0.75rem;
      }

      .content-area {
        flex: 1;
      }

      .bottom-nav {
        display: none;
      }
    }
  `;

  @state()
  private currentRoute: string | null = null;

  private readonly navItems: Array<{
    href: string;
    component: string;
    label: string;
  }> = [
  { href: '/', component: 'home-page', label: 'Home' },
  { href: '/settings', component: 'settings-page', label: 'Settings' },
  ];

  private router: Router;

  constructor() {
    super();
    
    this.router = new Router([
  { pattern: '/', component: 'home-page' },
  { pattern: '/settings', component: 'settings-page' },
    ]);

    this.router.onRouteChange((route) => {
      this.currentRoute = route;
    });
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

  render() {
    return html`
      <div class="layout">
        <aside class="side-nav">
          <div class="brand">Feeding Tracker</div>
          <nav class="nav-links" aria-label="Primary navigation" @click=${this.handleNavClick}>
            ${this.renderNavLinks()}
          </nav>
        </aside>
        <div class="content-area">
          <header>
            <div class="brand">Feeding Tracker</div>
          </header>
          <main>
            ${this.renderCurrentPage()}
          </main>
        </div>
      </div>
      <nav class="bottom-nav nav-links" aria-label="Primary navigation" @click=${this.handleNavClick}>
        ${this.renderNavLinks()}
      </nav>
    `;
  }

  private renderNavLinks() {
    return this.navItems.map(({ href, component, label }) => {
      const active = this.isActiveRoute(component);
      return html`
        <a
          href=${href}
          class="nav-link ${active ? 'active' : ''}"
          aria-current=${active ? 'page' : 'false'}
        >
          <span class="nav-label">${label}</span>
        </a>
      `;
    });
  }

  private renderCurrentPage() {
    switch (this.currentRoute) {
      case 'home-page':
        return html`<home-page></home-page>`;
      case 'settings-page':
        return html`<settings-page></settings-page>`;
      case 'not-found':
      default:
        return html`<not-found-page></not-found-page>`;
    }
  }
}
