import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { Router } from './router/router.js';
import './pages/home-page.js';
import './pages/about-page.js';
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
    }

    header {
      background: var(--md-sys-color-surface);
      color: var(--md-sys-color-on-surface);
      padding: 1rem 1.5rem;
      box-shadow: var(--md-sys-elevation-2);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .header-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    h1 {
      margin: 0;
      font-size: var(--md-sys-typescale-title-large-font-size);
      font-weight: var(--md-sys-typescale-title-large-font-weight);
      line-height: var(--md-sys-typescale-title-large-line-height);
      color: var(--md-sys-color-on-surface);
    }

    nav {
      display: flex;
      gap: 0.5rem;
    }

    nav a {
      color: var(--md-sys-color-on-surface-variant);
      text-decoration: none;
      font-weight: 500;
      font-size: var(--md-sys-typescale-label-large-font-size);
      line-height: var(--md-sys-typescale-label-large-line-height);
      padding: 0.625rem 1rem;
      border-radius: var(--md-sys-shape-corner-extra-large);
      transition: background-color 0.2s, color 0.2s;
      position: relative;
    }

    nav a:hover {
      background-color: var(--md-sys-color-surface-container-highest);
    }

    nav a.active {
      background-color: var(--md-sys-color-secondary-container);
      color: var(--md-sys-color-on-secondary-container);
    }

    main {
      min-height: calc(100vh - 80px);
    }
  `;

  @state()
  private currentRoute: string | null = null;

  private router: Router;

  constructor() {
    super();
    
    this.router = new Router([
      { pattern: '/', component: 'home-page' },
      { pattern: '/about', component: 'about-page' },
    ]);

    this.router.onRouteChange((route) => {
      this.currentRoute = route;
    });
  }

  private isActive(path: string): string {
    const currentPath = window.location.pathname;
    return currentPath === path ? 'active' : '';
  }

  private handleNavClick(e: Event) {
    const target = e.target as HTMLElement;
    const link = target.closest('a');
    
    if (link && link.href && link.origin === window.location.origin) {
      e.preventDefault();
      this.router.navigate(link.pathname);
    }
  }

  render() {
    return html`
      <header>
        <div class="header-content">
          <h1>Feeding Tracker</h1>
          <nav @click="${this.handleNavClick}">
            <a href="/" class="${this.isActive('/')}">Home</a>
            <a href="/about" class="${this.isActive('/about')}">About</a>
          </nav>
        </div>
      </header>
      <main>
        ${this.renderCurrentPage()}
      </main>
    `;
  }

  private renderCurrentPage() {
    switch (this.currentRoute) {
      case 'home-page':
        return html`<home-page></home-page>`;
      case 'about-page':
        return html`<about-page></about-page>`;
      case 'not-found':
      default:
        return html`<not-found-page></not-found-page>`;
    }
  }
}
