export interface RouteConfig {
  pattern: string;
  component: string;
  loader?: () => Promise<unknown>;
}

export interface RouterOptions {
  notFound?: {
    component: string;
    loader?: () => Promise<unknown>;
  };
}

export interface RouteMatch {
  pathname: Record<string, string>;
  search: Record<string, string>;
}

// URLPattern type definition for TypeScript
declare global {
  interface NavigateEvent extends Event {
    canIntercept: boolean;
    hashChange: boolean;
    downloadRequest: boolean;
    formData: FormData | null;
    navigationType: 'reload' | 'push' | 'replace' | 'traverse';
    destination: {
      url: string;
      getState(): unknown;
    };
    signal: AbortSignal;
    intercept(options?: {
      handler?: () => void | Promise<void>;
      focusReset?: 'manual' | 'after-transition';
      scroll?: 'manual' | 'after-transition';
    }): void;
  }

  interface Navigation {
    addEventListener(
      type: 'navigate',
      listener: (event: NavigateEvent) => void,
      options?: boolean | AddEventListenerOptions
    ): void;
    removeEventListener(
      type: 'navigate',
      listener: (event: NavigateEvent) => void,
      options?: boolean | EventListenerOptions
    ): void;
    navigate(
      url: string,
      options?: { history?: 'auto' | 'push' | 'replace'; state?: unknown; info?: unknown }
    ): {
      committed: Promise<unknown>;
      finished: Promise<unknown>;
    };
  }

  interface Scheduler {
    postTask<T>(
      callback: () => T | Promise<T>,
      options?: {
        priority?: 'user-blocking' | 'user-visible' | 'background';
        delay?: number;
        signal?: AbortSignal;
      }
    ): Promise<T>;
  }

  interface Window {
    navigation?: Navigation;
    scheduler?: Scheduler;
  }

  class URLPattern {
    constructor(init?: URLPatternInit);
    exec(input: string | URL): URLPatternResult | null;
  }

  interface URLPatternInit {
    protocol?: string;
    username?: string;
    password?: string;
    hostname?: string;
    port?: string;
    pathname?: string;
    search?: string;
    hash?: string;
    baseURL?: string;
  }

  interface URLPatternResult {
    inputs: [string | URL];
    protocol: URLPatternComponentResult;
    username: URLPatternComponentResult;
    password: URLPatternComponentResult;
    hostname: URLPatternComponentResult;
    port: URLPatternComponentResult;
    pathname: URLPatternComponentResult;
    search: URLPatternComponentResult;
    hash: URLPatternComponentResult;
  }

  interface URLPatternComponentResult {
    input: string;
    groups: Record<string, string>;
  }
}

export class Router {
  private routes: Array<{ pattern: URLPattern; config: RouteConfig }> = [];
  private currentRoute: string | null = null;
  private currentPath: string = typeof window !== 'undefined' ? window.location.pathname : '/';
  private currentParams: RouteMatch = { pathname: {}, search: {} };
  private listeners: Set<(route: string, params: RouteMatch) => void> = new Set();
  private componentLoaders: Map<string, () => Promise<unknown>> = new Map();
  private componentPromises: Map<string, Promise<void>> = new Map();
  private readonly notFound?: RouterOptions['notFound'];
  private scrollPositions: Map<string, number> = new Map();
  private scrollContainerGetter: (() => HTMLElement | null) | null = null;
  private readonly navigationApi =
    typeof window !== 'undefined' &&
    typeof window.navigation !== 'undefined' &&
    typeof window.navigation?.addEventListener === 'function' &&
    typeof window.navigation?.navigate === 'function'
      ? window.navigation
      : undefined;

  private readonly popStateHandler = () => {
    void this.handleRoute(undefined, undefined, 'traverse');
  };

  private readonly navigationHandler = (event: NavigateEvent) => {
    if (!this.shouldHandleNavigationEvent(event)) {
      return;
    }

    const url = new URL(event.destination.url);

    event.intercept({
      scroll: 'manual',
      handler: async () => {
        await this.handleRoute(url, event.signal, event.navigationType);
      },
    });
  };

  constructor(routes: RouteConfig[], options?: RouterOptions) {
    this.routes = routes.map((config) => {
      const urlPattern = new URLPattern({ pathname: config.pattern });

      if (config.loader) {
        this.componentLoaders.set(config.component, config.loader);
      }

      return { pattern: urlPattern, config };
    });

    if (options?.notFound) {
      this.notFound = options.notFound;

      if (options.notFound.loader) {
        this.componentLoaders.set(options.notFound.component, options.notFound.loader);
      }
    }

    this.init();
  }

  private init() {
    // Handle initial route
    void this.handleRoute();

    if (this.navigationApi) {
      this.navigationApi.addEventListener('navigate', this.navigationHandler);
    } else {
      // Listen to popstate events (back/forward navigation)
      window.addEventListener('popstate', this.popStateHandler);
    }
  }

  private async ensureComponent(component: string) {
    if (customElements.get(component)) {
      return;
    }

    const loader = this.componentLoaders.get(component);
    if (!loader) {
      return;
    }

    let loadPromise = this.componentPromises.get(component);
    if (!loadPromise) {
      loadPromise = (async () => {
        try {
          await loader();
        } catch (error) {
          this.componentPromises.delete(component);
          throw error;
        }
      })();

      this.componentPromises.set(component, loadPromise);
    }

    await loadPromise;
  }

  private async handleRoute(
    url = new URL(window.location.href),
    signal?: AbortSignal,
    navigationType?: 'reload' | 'push' | 'replace' | 'traverse'
  ) {
    if (signal?.aborted) {
      return;
    }

    // Save current scroll position before navigating away
    if (this.currentRoute && this.currentPath) {
      this.saveScrollPosition();
    }

    // Update current path to the new path
    this.currentPath = url.pathname;

    for (const { pattern, config } of this.routes) {
      const match = pattern.exec(url);

      if (match) {
        const params: RouteMatch = {
          pathname: match.pathname.groups || {},
          search: Object.fromEntries(url.searchParams),
        };

        this.currentRoute = config.component;
        this.currentParams = params;

        await this.ensureComponent(config.component);

        if (signal?.aborted) {
          return;
        }

        this.notifyListeners(config.component, params);

        // Restore scroll position after route is set
        // Use navigationType to determine if we should restore or reset scroll
        const shouldRestore = navigationType === 'traverse' || navigationType === 'reload';
        this.restoreScrollPosition(url.pathname, shouldRestore);

        return;
      }
    }

    // No match found, could handle 404 here
    const notFoundComponent = this.notFound?.component ?? 'not-found-page';

    this.currentRoute = notFoundComponent;
    this.currentParams = { pathname: {}, search: {} };

    await this.ensureComponent(notFoundComponent);

    if (signal?.aborted) {
      return;
    }

    this.notifyListeners(notFoundComponent, this.currentParams);

    // Reset scroll for 404 pages
    this.restoreScrollPosition(url.pathname, false);
  }

  private notifyListeners(route: string, params: RouteMatch) {
    this.listeners.forEach((listener) => listener(route, params));
  }

  public navigate(path: string) {
    if (!this.shouldNavigate(path)) {
      return;
    }

    const targetUrl = new URL(path, window.location.origin);
    const relativeTarget = `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`;

    if (this.navigationApi) {
      this.navigationApi.navigate(targetUrl.toString());
    } else {
      window.history.pushState({}, '', relativeTarget);
      void this.handleRoute(targetUrl, undefined, 'push');
    }
  }

  public onRouteChange(callback: (route: string, params: RouteMatch) => void) {
    this.listeners.add(callback);

    // Call immediately with current route if it exists
    if (this.currentRoute !== null) {
      callback(this.currentRoute, this.currentParams);
    }

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  public getCurrentRoute(): string | null {
    return this.currentRoute;
  }

  public setScrollContainer(getter: () => HTMLElement | null): void {
    this.scrollContainerGetter = getter;
  }

  private saveScrollPosition(): void {
    if (!this.scrollContainerGetter) {
      return;
    }

    const container = this.scrollContainerGetter();
    if (!container) {
      return;
    }

    const scrollTop = container.scrollTop;

    this.scrollPositions.set(this.currentPath, scrollTop);

    // Limit stored positions to prevent memory leaks
    // Keep only the last 20 positions
    if (this.scrollPositions.size > 20) {
      // Remove oldest entries until we have exactly 20
      const entriesToRemove = this.scrollPositions.size - 20;
      const iterator = this.scrollPositions.keys();
      for (let i = 0; i < entriesToRemove; i++) {
        const key = iterator.next().value;
        if (key !== undefined) {
          this.scrollPositions.delete(key);
        }
      }
    }
  }

  private restoreScrollPosition(pathname: string, shouldRestore: boolean): void {
    if (!this.scrollContainerGetter) {
      return;
    }

    // Use requestAnimationFrame to ensure DOM is updated
    requestAnimationFrame(() => {
      const container = this.scrollContainerGetter?.();
      if (!container) {
        return;
      }

      if (shouldRestore) {
        const savedPosition = this.scrollPositions.get(pathname);
        if (savedPosition !== undefined) {
          container.scrollTop = savedPosition;
        } else {
          // If no saved position, scroll to top
          container.scrollTop = 0;
        }
      } else {
        // For new navigations (push), always scroll to top
        container.scrollTop = 0;
      }
    });
  }

  private shouldHandleNavigationEvent(event: NavigateEvent) {
    if (!event.canIntercept || event.hashChange || event.downloadRequest || event.formData) {
      return false;
    }

    try {
      const url = new URL(event.destination.url);
      return url.origin === window.location.origin;
    } catch {
      return false;
    }
  }

  private shouldNavigate(path: string) {
    const targetUrl = new URL(path, window.location.origin);
    const currentUrl = new URL(window.location.href);
    return currentUrl.pathname !== targetUrl.pathname || currentUrl.search !== targetUrl.search;
  }
}
