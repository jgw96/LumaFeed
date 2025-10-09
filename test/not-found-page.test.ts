import { describe, it, expect, afterEach } from 'vitest';
import '../src/pages/not-found-page.js';
import { cleanup, mountComponent, queryShadow } from './helpers.js';
import type { NotFoundPage } from '../src/pages/not-found-page.js';

describe('NotFoundPage', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render the 404 page', async () => {
    const notFoundPage = await mountComponent<NotFoundPage>('not-found-page');
    
    const h1 = queryShadow(notFoundPage, 'h1');
    expect(h1?.textContent).toBe('404');
  });

  it('should display page not found message', async () => {
    const notFoundPage = await mountComponent<NotFoundPage>('not-found-page');
    
    const h2 = queryShadow(notFoundPage, 'h2');
    expect(h2?.textContent).toBe('Page Not Found');
    
    const p = queryShadow(notFoundPage, 'p');
    expect(p?.textContent?.trim()).toContain("doesn't exist");
  });

  it('should render link to home page', async () => {
    const notFoundPage = await mountComponent<NotFoundPage>('not-found-page');
    
    const homeLink = queryShadow<HTMLAnchorElement>(notFoundPage, 'a[href="/"]');
    expect(homeLink).toBeTruthy();
    expect(homeLink?.textContent).toBe('Go back home');
  });
});
