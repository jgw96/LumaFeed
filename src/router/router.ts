export interface RouteConfig {
  pattern: string;
  component: string;
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
  private routes: Map<URLPattern, string> = new Map();
  private currentRoute: string | null = null;
  private currentParams: RouteMatch = { pathname: {}, search: {} };
  private listeners: Set<(route: string, params: RouteMatch) => void> = new Set();

  constructor(routes: RouteConfig[]) {
    routes.forEach(({ pattern, component }) => {
      const urlPattern = new URLPattern({ pathname: pattern });
      this.routes.set(urlPattern, component);
    });

    this.init();
  }

  private init() {
    // Handle initial route
    this.handleRoute();

    // Listen to popstate events (back/forward navigation)
    window.addEventListener('popstate', () => {
      this.handleRoute();
    });
  }

  private handleRoute() {
    const url = new URL(window.location.href);

    for (const [pattern, component] of this.routes) {
      const match = pattern.exec(url);
      
      if (match) {
        this.currentRoute = component;
        
        // Extract pathname params
        const params: RouteMatch = {
          pathname: match.pathname.groups || {},
          search: Object.fromEntries(url.searchParams)
        };
        
        this.currentParams = params;
        this.notifyListeners(component, params);
        return;
      }
    }

    // No match found, could handle 404 here
    this.currentRoute = 'not-found';
    this.currentParams = { pathname: {}, search: {} };
    this.notifyListeners('not-found', this.currentParams);
  }

  private notifyListeners(route: string, params: RouteMatch) {
    this.listeners.forEach(listener => listener(route, params));
  }

  public navigate(path: string) {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
      this.handleRoute();
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
