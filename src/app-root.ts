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
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
        Oxygen, Ubuntu, Cantarell, sans-serif;
    }

    header {
      background: #0066cc;
      color: white;
      padding: 1rem 2rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
      font-size: 1.5rem;
      font-weight: 600;
    }

    nav {
      display: flex;
      gap: 1.5rem;
    }

    nav a {
      color: white;
      text-decoration: none;
      font-weight: 500;
      transition: opacity 0.2s;
    }

    nav a:hover {
      opacity: 0.8;
    }

    nav a.active {
      text-decoration: underline;
      text-underline-offset: 4px;
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
