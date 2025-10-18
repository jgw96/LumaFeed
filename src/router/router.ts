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

    // Listen to popstate events (back/forward navigation)
    window.addEventListener('popstate', () => {
      void this.handleRoute();
    });
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

  private async handleRoute() {
    const url = new URL(window.location.href);

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

        this.notifyListeners(config.component, params);
        return;
      }
    }

    // No match found, could handle 404 here
    const notFoundComponent = this.notFound?.component ?? 'not-found-page';

    this.currentRoute = notFoundComponent;
    this.currentParams = { pathname: {}, search: {} };

    await this.ensureComponent(notFoundComponent);

    this.notifyListeners(notFoundComponent, this.currentParams);
  }

  private notifyListeners(route: string, params: RouteMatch) {
    this.listeners.forEach((listener) => listener(route, params));
  }

  public navigate(path: string) {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
      void this.handleRoute();
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
}
