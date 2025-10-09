import { describe, it, expect, afterEach } from 'vitest';
import '../src/pages/about-page.js';
import { cleanup, mountComponent, queryShadow } from './helpers.js';
import type { AboutPage } from '../src/pages/about-page.js';

describe('AboutPage', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render the about page', async () => {
    const aboutPage = await mountComponent<AboutPage>('about-page');
    
    const h1 = queryShadow(aboutPage, 'h1');
    expect(h1?.textContent).toBe('About');
  });

  it('should render page description', async () => {
    const aboutPage = await mountComponent<AboutPage>('about-page');
    
    const paragraphs = queryShadow(aboutPage, 'p');
    expect(paragraphs).toBeTruthy();
    expect(paragraphs?.textContent).toContain('Feeding Tracker');
  });

  it('should render technology stack section', async () => {
    const aboutPage = await mountComponent<AboutPage>('about-page');
    
    const techStack = queryShadow(aboutPage, '.tech-stack');
    expect(techStack).toBeTruthy();
    
    const h2 = queryShadow(aboutPage, '.tech-stack h2');
    expect(h2?.textContent).toBe('Technology Stack');
  });

  it('should list technologies used', async () => {
    const aboutPage = await mountComponent<AboutPage>('about-page');
    
    const list = queryShadow(aboutPage, 'ul');
    expect(list).toBeTruthy();
    
    const listItems = queryShadow(aboutPage, 'ul')?.querySelectorAll('li');
    expect(listItems).toBeTruthy();
    expect(listItems!.length).toBeGreaterThan(0);
    
    const technologies = Array.from(listItems!).map(li => li.textContent);
    expect(technologies.some(tech => tech?.includes('Lit'))).toBe(true);
    expect(technologies.some(tech => tech?.includes('TypeScript'))).toBe(true);
    expect(technologies.some(tech => tech?.includes('Vite'))).toBe(true);
  });
});
