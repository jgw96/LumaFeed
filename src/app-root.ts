import { LitElement, html, css, nothing, svg } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { customElement, state, query } from 'lit/decorators.js';
import { Router } from './router/router.js';
import './components/app-header-menu.js';
import './components/pwa-install-prompt.js';
// Home page will be lazy-loaded via the router loader for better chunking

import { hasCompletedIntroExperience } from './utils/intro-experience.js';
import type { VoiceControlController } from './services/voice-control.js';

import type { HomePage } from './pages/home-page.js';
import type { AppToast } from './components/app-toast.js';
import './components/app-toast.js';
// insights-page will be lazy-loaded via the router loader

@customElement('app-root')
export class AppRoot extends LitElement {
  static styles = css`
    :host {
      display: block;
      /* Use the small viewport height to avoid content being pushed below the visible area
         when browser UI (URL bar/toolbars) expands on mobile. This preserves confined
         scrolling while keeping bottom nav fully visible. */
      height: 100svh;
      overflow: hidden;
      font-family:
        'Roboto',
        -apple-system,
        BlinkMacSystemFont,
        'Segoe UI',
        Oxygen,
        Ubuntu,
        Cantarell,
        sans-serif;
      background-color: var(--md-sys-color-background);
      color: var(--md-sys-color-on-background);
      --bottom-nav-height: 52px;
    }

    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.5rem;
      background: transparent;
      backdrop-filter: blur(46px);
      color: var(--md-sys-color-on-surface);
      position: sticky;
      top: 0;
      z-index: 10;
      gap: 1rem;
    }

    .back-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border: none;
      border-radius: 50%;
      background: var(--md-sys-color-surface-container);
      color: var(--md-sys-color-on-surface);
      cursor: pointer;
      font-size: 1.5rem;
      transition: background-color 0.2s;
    }

    .back-button:hover,
    .back-button:focus-visible {
      background: var(--md-sys-color-surface-container-high);
      outline: none;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: var(--md-sys-typescale-title-large-font-size);
      font-weight: var(--md-sys-typescale-title-large-font-weight);
      line-height: var(--md-sys-typescale-title-large-line-height);
      height: 40px;
      min-height: 40px;
      transform-origin: left center;
      view-transition-name: header-brand;
    }

    .brand img {
      width: 28px;
      height: 28px;
      flex-shrink: 0;
      object-fit: contain;
    }

    .brand span {
      display: inline-flex;
      align-items: center;
      height: 28px;
      line-height: 1;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .voice-btn {
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
      transition:
        background-color 0.2s ease,
        color 0.2s ease;
      font-size: 1.5rem;
      line-height: 1;
    }

    .voice-btn:hover,
    .voice-btn:focus-visible {
      background: var(--md-sys-color-surface-container);
      color: var(--md-sys-color-on-surface);
      outline: none;
    }

    .voice-btn:active {
      background: var(--md-sys-color-surface-container-high);
    }

    .voice-btn.active {
      background: var(--md-sys-color-primary-container);
      color: var(--md-sys-color-on-primary-container);
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%,
      100% {
        opacity: 1;
      }
      50% {
        opacity: 0.7;
      }
    }

    .layout {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }

    .content-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .page-container {
      flex: 1;
      /* Ensure scrollable content never sits under the bottom nav on small screens */
      padding: 0 0 calc(1.5rem + var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px));
      position: relative;
      view-transition-name: page-transition;
      overflow-x: hidden;
      overflow-y: auto;
      overscroll-behavior: contain;
      -webkit-overflow-scrolling: touch;
    }

    .bottom-nav {
      display: flex;
      background: var(--md-sys-color-surface);
      box-shadow: var(--md-sys-elevation-3);
      border-top: 1px solid var(--md-sys-color-outline-variant);
      /* Add safe-area padding so navigation is not clipped by device cutouts */
      padding: 0.25rem 0.75rem calc(0.25rem + env(safe-area-inset-bottom, 0px));
      min-height: var(--bottom-nav-height);
      gap: 0.5rem;
      z-index: 0;
      flex-shrink: 0;
    }

    .bottom-nav.hidden {
      display: none;
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
      height: auto;
      min-height: auto;
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
      gap: 0.25rem;
    }

    .nav-link {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 0.25rem;
      text-decoration: none;
      color: var(--md-sys-color-on-surface-variant);
      font-size: 0.75rem;
      font-weight: 500;
      line-height: 1rem;
      letter-spacing: 0.5px;
      padding: 0.5rem 0.5rem 0.75rem;
      position: relative;
      transition: color 0.2s ease;
      border-radius: 0;
    }

    /* Active indicator pill behind icon */
    .nav-link::before {
      content: '';
      position: absolute;
      top: 0.25rem;
      width: 64px;
      height: 32px;
      border-radius: 16px;
      background: transparent;
      transition: background-color 0.2s ease;
      z-index: 0;
    }

    .nav-link::after {
      display: none;
    }

    .nav-link:hover::before {
      background: color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent);
    }

    .nav-link.active {
      color: var(--md-sys-color-on-surface);
    }

    .nav-link.active::before {
      background: var(--md-sys-color-secondary-container);
    }

    .nav-icon {
      width: 24px;
      height: 24px;
      flex-shrink: 0;
      transition: all 0.2s ease;
      color: inherit;
      position: relative;
      z-index: 1;
    }

    .nav-icon path {
      transition:
        fill 0.2s ease,
        stroke 0.2s ease;
    }

    .nav-label {
      position: relative;
      z-index: 1;
    }

    @media (min-width: 768px) {
      :host {
        --bottom-nav-height: 0px;
      }

      header {
        display: none;
      }

      :host([data-detail-route]) header {
        display: flex;
      }

      :host([data-detail-route]) header .brand,
      :host([data-detail-route]) header .header-actions {
        display: none;
      }

      .layout {
        flex-direction: row;
      }

      .side-nav {
        display: flex;
        padding: 0 1.25rem;
        box-shadow: var(--md-sys-elevation-0);
        border-right: 1px solid
          color-mix(in srgb, var(--md-sys-color-outline-variant) 50%, transparent);
      }

      .side-nav__content {
        position: sticky;
        top: 2rem;
        padding-top: 0;
        width: 100%;
      }

      .side-nav .nav-links {
        flex-direction: column;
        gap: 0.25rem;
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
        padding: 1rem;
        border-radius: 20px;
        gap: 0.75rem;
        font-size: 0.875rem;
        font-weight: 500;
        letter-spacing: 0.01em;
        position: relative;
        transition: all 0.2s ease;
        background: transparent;
      }

      .side-nav .nav-link::before {
        display: none;
      }

      .side-nav .nav-link::after {
        display: none;
      }

      .side-nav .nav-link:hover {
        background: color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent);
      }

      .side-nav .nav-link.active {
        background: var(--md-sys-color-secondary-container);
        color: var(--md-sys-color-on-secondary-container);
        font-weight: 600;
      }

      .side-nav .nav-link.active:hover {
        background: color-mix(
          in srgb,
          var(--md-sys-color-secondary-container) 92%,
          var(--md-sys-color-on-secondary-container)
        );
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

      .bottom-nav {
        display: none;
      }

      .nav-label {
        margin-left: 0;
        font-size: inherit;
      }
    }

    :host([data-detail-route]) .brand {
      transform: translateX(8px);
      opacity: 0.92;
    }
  `;

  @state()
  private currentRoute: string | null = null;

  @state()
  private showBackButton = false;

  @query('feeding-import-dialog')
  private importDialog?: HTMLElementTagNameMap['feeding-import-dialog'];

  @query('app-intro-dialog')
  private introDialog?: HTMLElementTagNameMap['app-intro-dialog'];

  @query('app-toast')
  private toast!: AppToast;

  @query('.page-container')
  private pageContainer?: HTMLElement;

  @state()
  private importDialogLoaded = false;

  @state()
  private introDialogLoaded = false;

  @state()
  private updateDialogVisible = false;

  private updateDialogLoaded = false;
  private pendingUpdateServiceWorker: ((reloadPage?: boolean) => Promise<void>) | null = null;

  private introHasBeenShown = false;
  private introCompleted = false;

  @state()
  private voiceControlActive = false;

  private voiceController: VoiceControlController | null = null;

  private readonly navItems: Array<{
    href: string;
    component: string;
    label: string;
    icon: string;
  }> = [
    { href: '/', component: 'home-page', label: 'Home', icon: 'home' },
    { href: '/diapers', component: 'diaper-page', label: 'Diapers', icon: 'diaper' },
    { href: '/insights', component: 'insights-page', label: 'Insights', icon: 'insights' },
    { href: '/settings', component: 'settings-page', label: 'Settings', icon: 'settings' },
  ];

  private router: Router;
  private lastViewTransitionFinished: Promise<void> | null = null;

  constructor() {
    super();

    this.router = new Router(
      [
        {
          pattern: '/',
          component: 'home-page',
          loader: () => import('./pages/home-page.js'),
        },
        {
          pattern: '/log',
          component: 'log-detail-page',
          loader: () => import('./pages/log-detail-page.js'),
        },
        {
          pattern: '/diapers',
          component: 'diaper-page',
          loader: () => import('./pages/diaper-page.js'),
        },
        {
          pattern: '/insights',
          component: 'insights-page',
          loader: () => import('./pages/insights-page.js'),
        },
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
    window.addEventListener('pwa-update-available', this.handleUpdateAvailable);
    window.addEventListener('voice-control-error', this.handleVoiceControlError as EventListener);
  }

  protected firstUpdated(): void {
    // Set up scroll container for router
    this.router.setScrollContainer(() => this.pageContainer ?? null);

    void this.maybeShowIntroExperience();
  }

  private isActiveRoute(component: string): boolean {
    return this.currentRoute === component;
  }

  private shouldShowBottomNav(): boolean {
    // Only show bottom nav on main navigation pages
    const mainPages = ['home-page', 'diaper-page', 'insights-page', 'settings-page'];
    return this.currentRoute ? mainPages.includes(this.currentRoute) : false;
  }

  private handleNavClick(event: Event) {
    const target = event.target as HTMLElement;
    const link = target?.closest('a');

    if (link instanceof HTMLAnchorElement && link.href) {
      const url = new URL(link.href, window.location.origin);
      if (url.origin === window.location.origin) {
        event.preventDefault();
        
        // Use Scheduler API with user-blocking priority if available
        if (window.scheduler?.postTask) {
          void window.scheduler.postTask(() => this.router.navigate(url.pathname), {
            priority: 'user-blocking',
          });
        } else {
          // Fallback for browsers without Scheduler API
          this.router.navigate(url.pathname);
        }
      }
    }
  }

  private performRouteTransition(route: string) {
    const updateRoute = async () => {
      this.currentRoute = route;
      // Show back button for detail pages
      this.showBackButton = route === 'log-detail-page';
      this.toggleAttribute('data-detail-route', this.showBackButton);
      await this.updateComplete;
    };

    if (this.currentRoute === null) {
      this.lastViewTransitionFinished = null;
      void updateRoute();
      return;
    }

    const startTransition = this.getViewTransitionStarter();

    if (!startTransition) {
      this.lastViewTransitionFinished = null;
      void updateRoute();
      return;
    }

    try {
      const transition = startTransition(updateRoute);
      this.lastViewTransitionFinished = transition?.finished ?? null;
      transition?.finished?.catch(() => {});
    } catch {
      this.lastViewTransitionFinished = null;
      void updateRoute();
    }
  }

  disconnectedCallback(): void {
    this.removeEventListener('logs-imported', this.handleLogsImported);
    window.removeEventListener('pwa-update-available', this.handleUpdateAvailable);
    window.removeEventListener(
      'voice-control-error',
      this.handleVoiceControlError as EventListener
    );

    // Clean up voice control if active
    if (this.voiceController) {
      this.voiceController.stop();
      this.voiceController = null;
    }

    super.disconnectedCallback();
  }

  private readonly handleUpdateAvailable = async (event: Event): Promise<void> => {
    const customEvent = event as CustomEvent<PWAUpdateAvailableDetail>;
    const updateServiceWorker = customEvent.detail?.updateServiceWorker;
    if (!updateServiceWorker) {
      return;
    }

    if (!this.updateDialogLoaded) {
      await import('./components/pwa-update-dialog.js');
      this.updateDialogLoaded = true;
    }

    this.pendingUpdateServiceWorker = updateServiceWorker;
    this.updateDialogVisible = true;
  };

  private readonly handleUpdateDialogDismissed = (): void => {
    this.updateDialogVisible = false;
  };

  private readonly handleUpdateDialogApplied = (): void => {
    this.updateDialogVisible = false;
    this.pendingUpdateServiceWorker = null;
  };

  private async maybeShowIntroExperience(): Promise<void> {
    if (this.introHasBeenShown || this.introCompleted) {
      return;
    }

    if (hasCompletedIntroExperience()) {
      this.introCompleted = true;
      return;
    }

    this.introHasBeenShown = true;
    await this.ensureIntroDialog();
    // If a view transition is currently running, wait for it to fully finish before
    // showing the intro dialog to avoid the transition overlay flashing over it.
    if (this.lastViewTransitionFinished) {
      try {
        await this.lastViewTransitionFinished;
      } catch {
        // ignore
      }
      // Ensure the UA removes the overlay by the next animation frame
      await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
    }
    this.introDialog?.open();
  }

  private handleIntroComplete = () => {
    this.introCompleted = true;
  };

  private handleIntroDismissed = () => {
    // Users can revisit the intro later from other entry points if exposed.
  };

  private getViewTransitionStarter():
    | ((updateCallback: () => Promise<void> | void) => { finished?: Promise<void> })
    | null {
    const doc = document as unknown as {
      startViewTransition?: (cb: () => Promise<void> | void) => { finished?: Promise<void> };
    };

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
            ${this.showBackButton
              ? html`
                  <button
                    class="back-button"
                    @click=${() => window.history.back()}
                    aria-label="Go back"
                    title="Go back"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="ionicon" viewBox="0 0 512 512">
                      <path
                        fill="none"
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="48"
                        d="M328 112L184 256l144 144"
                      />
                    </svg>
                  </button>
                `
              : nothing}
            <div class="brand" part="header-brand">
              <span>LumaFeed</span>
            </div>
            <div class="header-actions">
              <button
                class="voice-btn ${this.voiceControlActive ? 'active' : ''}"
                @click=${this.handleVoiceControlToggle}
                aria-label="${this.voiceControlActive
                  ? 'Stop voice control'
                  : 'Start voice control'}"
                title="${this.voiceControlActive ? 'Stop voice control' : 'Start voice control'}"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  fill="currentColor"
                >
                  ${this.voiceControlActive
                    ? svg`
                        <!-- Microphone active -->
                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                      `
                    : svg`
                        <!-- Microphone inactive -->
                        <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
                      `}
                </svg>
              </button>
              <app-header-menu @import-feeds=${this.handleImportFeedsRequested}></app-header-menu>
            </div>
          </header>
          <main class="page-container" part="page-transition">${this.renderCurrentPage()}</main>
        </div>
        <nav
          class="bottom-nav nav-links ${this.shouldShowBottomNav() ? '' : 'hidden'}"
          aria-label="Primary navigation"
          @click=${this.handleNavClick}
        >
          ${this.renderNavLinks()}
        </nav>
      </div>
      ${this.importDialogLoaded ? html`<feeding-import-dialog></feeding-import-dialog>` : nothing}
      ${this.introDialogLoaded
        ? html`<app-intro-dialog
            @intro-complete=${this.handleIntroComplete}
            @intro-dismissed=${this.handleIntroDismissed}
          ></app-intro-dialog>`
        : nothing}
      <pwa-install-prompt></pwa-install-prompt>
      ${this.updateDialogLoaded && this.updateDialogVisible
        ? html`<pwa-update-dialog
            .open=${this.updateDialogVisible}
            .updateServiceWorker=${this.pendingUpdateServiceWorker}
            @pwa-update-dismissed=${this.handleUpdateDialogDismissed}
            @pwa-update-applied=${this.handleUpdateDialogApplied}
          ></pwa-update-dialog>`
        : nothing}
      <app-toast></app-toast>
    `;
  }

  private getIconSvg(iconName: string, active: boolean) {
    type IconPath = {
      d: string;
      fill?: string;
      stroke?: string;
      strokeWidth?: string;
      strokeLinecap?: 'round' | 'butt' | 'square';
      strokeLinejoin?: 'round' | 'bevel' | 'miter';
      fillRule?: 'evenodd' | 'nonzero';
      clipRule?: 'evenodd' | 'nonzero';
    };

    type IconDefinition = {
      viewBox?: string;
      outlined: IconPath[];
      filled: IconPath[];
    };

    const icons: Record<string, IconDefinition> = {
      home: {
        outlined: [
          {
            d: 'M12 4L4 10.5V20h5.5v-5.5h5V20H20V10.5L12 4z',
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: '1.6',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
          },
          {
            d: 'M10 20v-5.5h4V20',
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: '1.6',
            strokeLinecap: 'round',
          },
        ],
        filled: [
          {
            d: 'M10 20v-5.5h4V20h5.5v-8.88L12 3 4.5 11.12V20z',
            fill: 'currentColor',
            fillRule: 'evenodd',
            clipRule: 'evenodd',
          },
        ],
      },
      settings: {
        viewBox: '0 0 512 512',
        outlined: [
          {
            d: 'M262.29 192.31a64 64 0 1057.4 57.4 64.13 64.13 0 00-57.4-57.4zM416.39 256a154.34 154.34 0 01-1.53 20.79l45.21 35.46a10.81 10.81 0 012.45 13.75l-42.77 74a10.81 10.81 0 01-13.14 4.59l-44.9-18.08a16.11 16.11 0 00-15.17 1.75A164.48 164.48 0 01325 400.8a15.94 15.94 0 00-8.82 12.14l-6.73 47.89a11.08 11.08 0 01-10.68 9.17h-85.54a11.11 11.11 0 01-10.69-8.87l-6.72-47.82a16.07 16.07 0 00-9-12.22 155.3 155.3 0 01-21.46-12.57 16 16 0 00-15.11-1.71l-44.89 18.07a10.81 10.81 0 01-13.14-4.58l-42.77-74a10.8 10.8 0 012.45-13.75l38.21-30a16.05 16.05 0 006-14.08c-.36-4.17-.58-8.33-.58-12.5s.21-8.27.58-12.35a16 16 0 00-6.07-13.94l-38.19-30A10.81 10.81 0 0149.48 186l42.77-74a10.81 10.81 0 0113.14-4.59l44.9 18.08a16.11 16.11 0 0015.17-1.75A164.48 164.48 0 01187 111.2a15.94 15.94 0 008.82-12.14l6.73-47.89A11.08 11.08 0 01213.23 42h85.54a11.11 11.11 0 0110.69 8.87l6.72 47.82a16.07 16.07 0 009 12.22 155.3 155.3 0 0121.46 12.57 16 16 0 0015.11 1.71l44.89-18.07a10.81 10.81 0 0113.14 4.58l42.77 74a10.8 10.8 0 01-2.45 13.75l-38.21 30a16.05 16.05 0 00-6.05 14.08c.33 4.14.55 8.3.55 12.47z',
            stroke: 'currentColor',
            strokeWidth: '32',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
          },
        ],
        filled: [
          {
            d: 'M262.29 192.31a64 64 0 1057.4 57.4 64.13 64.13 0 00-57.4-57.4zM416.39 256a154.34 154.34 0 01-1.53 20.79l45.21 35.46a10.81 10.81 0 012.45 13.75l-42.77 74a10.81 10.81 0 01-13.14 4.59l-44.9-18.08a16.11 16.11 0 00-15.17 1.75A164.48 164.48 0 01325 400.8a15.94 15.94 0 00-8.82 12.14l-6.73 47.89a11.08 11.08 0 01-10.68 9.17h-85.54a11.11 11.11 0 01-10.69-8.87l-6.72-47.82a16.07 16.07 0 00-9-12.22 155.3 155.3 0 01-21.46-12.57 16 16 0 00-15.11-1.71l-44.89 18.07a10.81 10.81 0 01-13.14-4.58l-42.77-74a10.8 10.8 0 012.45-13.75l38.21-30a16.05 16.05 0 006-14.08c-.36-4.17-.58-8.33-.58-12.5s.21-8.27.58-12.35a16 16 0 00-6.07-13.94l-38.19-30A10.81 10.81 0 0149.48 186l42.77-74a10.81 10.81 0 0113.14-4.59l44.9 18.08a16.11 16.11 0 0015.17-1.75A164.48 164.48 0 01187 111.2a15.94 15.94 0 008.82-12.14l6.73-47.89A11.08 11.08 0 01213.23 42h85.54a11.11 11.11 0 0110.69 8.87l6.72 47.82a16.07 16.07 0 009 12.22 155.3 155.3 0 0121.46 12.57 16 16 0 0015.11 1.71l44.89-18.07a10.81 10.81 0 0113.14 4.58l42.77 74a10.8 10.8 0 01-2.45 13.75l-38.21 30a16.05 16.05 0 00-6.05 14.08c.33 4.14.55 8.3.55 12.47z',
            fill: 'currentColor',
            fillRule: 'evenodd',
            clipRule: 'evenodd',
          },
        ],
      },
      diaper: {
        outlined: [
          {
            d: 'M12 2c-4.41 0-8 3.59-8 8 0 5.46 7.08 11.72 7.38 11.99.17.14.38.21.62.21s.45-.07.62-.21C12.92 21.72 20 15.46 20 10c0-4.41-3.59-8-8-8zm0 18.07c-2.3-2.13-6-6.26-6-10.07 0-3.31 2.69-6 6-6s6 2.69 6 6c0 3.81-3.7 7.94-6 10.07z',
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: '1.6',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
          },
        ],
        filled: [
          {
            d: 'M12 2C7.59 2 4 5.59 4 10c0 5.46 7.08 11.72 7.38 11.99.17.14.38.21.62.21s.45-.07.62-.21C12.92 21.72 20 15.46 20 10c0-4.41-3.59-8-8-8zm0 16c-1.79-1.66-5-5.07-5-8 0-2.76 2.24-5 5-5s5 2.24 5 5c0 2.93-3.21 6.34-5 8z',
            fill: 'currentColor',
            fillRule: 'evenodd',
            clipRule: 'evenodd',
          },
        ],
      },
      insights: {
        outlined: [
          {
            d: 'M3 3v18h18',
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: '1.6',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
          },
          {
            d: 'M7 16l3.5-4.5 3 3L19 8',
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: '1.6',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
          },
          {
            d: 'M16 8h3v3',
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: '1.6',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
          },
        ],
        filled: [
          {
            d: 'M3 2a1 1 0 0 0-1 1v18a1 1 0 0 0 1 1h18a1 1 0 1 0 0-2H4V3a1 1 0 0 0-1-1z',
            fill: 'currentColor',
          },
          {
            d: 'M19.707 7.293l-5.5 6a1 1 0 0 1-1.414.086l-2.5-2.5-2.793 3.914a1 1 0 1 1-1.628-1.162l3.5-4.5a1 1 0 0 1 1.456-.128l2.586 2.586 4.793-5.226V7a1 1 0 1 0 2 0V4a1 1 0 0 0-1-1h-3a1 1 0 1 0 0 2h.586l-.293.293z',
            fill: 'currentColor',
          },
        ],
      },
    };

    const icon = icons[iconName];
    if (!icon) {
      return nothing;
    }

    const paths = active ? icon.filled : icon.outlined;

    return svg`
      <svg
        class="nav-icon"
        viewBox=${icon.viewBox ?? '0 0 24 24'}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        ${paths.map(
          (segment) => svg`<path
            d=${segment.d}
            fill=${segment.fill ?? (segment.stroke ? 'none' : 'currentColor')}
            stroke=${ifDefined(segment.stroke)}
            stroke-width=${ifDefined(segment.strokeWidth)}
            stroke-linecap=${ifDefined(segment.strokeLinecap)}
            stroke-linejoin=${ifDefined(segment.strokeLinejoin)}
            fill-rule=${ifDefined(segment.fillRule)}
            clip-rule=${ifDefined(segment.clipRule)}
          ></path>`
        )}
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

  private handleVoiceControlError = (event: Event) => {
    const customEvent = event as CustomEvent<{ message: string }>;
    const errorMessage = customEvent.detail?.message || 'Voice control error';

    this.toast?.show({
      headline: 'Voice Control Error',
      supporting: errorMessage,
      icon: '🎤',
    });
  };

  private handleVoiceControlToggle = async () => {
    if (this.voiceControlActive) {
      // Stop voice control
      this.voiceController?.stop();
      this.voiceController = null;
      this.voiceControlActive = false;
      console.log('[app-root] Voice control stopped');
    } else {
      // Start voice control
      try {
        const { initVoiceControl } = await import('./services/voice-control.js');
        this.voiceController = await initVoiceControl();
        this.voiceControlActive = true;
        console.log('[app-root] Voice control started');
      } catch (error) {
        console.error('[app-root] Failed to start voice control:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        window.dispatchEvent(
          new CustomEvent('voice-control-error', {
            detail: { message: errorMessage },
          })
        );
      }
    }
  };

  private async ensureImportDialog(): Promise<void> {
    await this.updateComplete;

    if (!this.importDialogLoaded) {
      if (!customElements.get('feeding-import-dialog')) {
        await import('./components/feeding-import-dialog.js');
      }

      await customElements.whenDefined('feeding-import-dialog');
      this.importDialogLoaded = true;
    }
  }

  private async ensureIntroDialog(): Promise<void> {
    await this.updateComplete;

    if (!this.introDialogLoaded) {
      if (!customElements.get('app-intro-dialog')) {
        await import('./components/app-intro-dialog.js');
      }

      await customElements.whenDefined('app-intro-dialog');
      this.introDialogLoaded = true;
    }
  }

  private handleImportFeedsRequested = async () => {
    await this.ensureImportDialog();
    this.importDialog?.open();
  };

  private renderCurrentPage() {
    switch (this.currentRoute) {
      case 'home-page':
        return html`<home-page></home-page>`;
      case 'log-detail-page':
        return html`<log-detail-page></log-detail-page>`;
      case 'diaper-page':
        return html`<diaper-page></diaper-page>`;
      case 'insights-page':
        return html`<insights-page></insights-page>`;
      case 'settings-page':
        return html`<settings-page></settings-page>`;
      case 'not-found-page':
      default:
        return html`<not-found-page></not-found-page>`;
    }
  }
}
