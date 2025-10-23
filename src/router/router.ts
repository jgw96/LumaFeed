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
    intercept(options?: { handler?: () => void | Promise<void>; focusReset?: 'manual' | 'after-transition'; scroll?: 'manual' | 'after-transition' }): void;
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
    navigate(url: string, options?: { history?: 'auto' | 'push' | 'replace'; state?: unknown; info?: unknown }): {
      committed: Promise<unknown>;
      finished: Promise<unknown>;
    };
  }

  interface Window {
    navigation?: Navigation;
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
  private currentParams: RouteMatch = { pathname: {}, search: {} };
  private listeners: Set<(route: string, params: RouteMatch) => void> = new Set();
  private componentLoaders: Map<string, () => Promise<unknown>> = new Map();
  private componentPromises: Map<string, Promise<void>> = new Map();
  private readonly notFound?: RouterOptions['notFound'];
  private readonly navigationApi =
    typeof window !== 'undefined' &&
    typeof window.navigation !== 'undefined' &&
    typeof window.navigation?.addEventListener === 'function' &&
    typeof window.navigation?.navigate === 'function'
      ? window.navigation
      : undefined;

  private readonly popStateHandler = () => {
    void this.handleRoute();
  };

  private readonly navigationHandler = (event: NavigateEvent) => {
    if (!this.shouldHandleNavigationEvent(event)) {
      return;
    }

    const url = new URL(event.destination.url);

    event.intercept({
      handler: async () => {
        await this.handleRoute(url, event.signal);
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

  private async handleRoute(url = new URL(window.location.href), signal?: AbortSignal) {
    if (signal?.aborted) {
      return;
    }

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
      void this.handleRoute(targetUrl);
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
