import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('about-page')
export class AboutPage extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 1.5rem;
      background-color: var(--md-sys-color-background);
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
    }

    h1 {
      color: var(--md-sys-color-on-background);
      margin-bottom: 1.5rem;
      font-size: var(--md-sys-typescale-headline-large-font-size);
      font-weight: var(--md-sys-typescale-headline-large-font-weight);
      line-height: var(--md-sys-typescale-headline-large-line-height);
    }

    p {
      color: var(--md-sys-color-on-surface-variant);
      line-height: 1.6;
      margin-bottom: 1rem;
      font-size: var(--md-sys-typescale-body-large-font-size);
    }

    .tech-stack {
      background: var(--md-sys-color-surface-container);
      border-radius: var(--md-sys-shape-corner-large);
      padding: 1.5rem;
      margin-top: 2rem;
      border: 1px solid var(--md-sys-color-outline-variant);
    }

    .tech-stack h2 {
      margin-top: 0;
      margin-bottom: 1rem;
      color: var(--md-sys-color-on-surface);
      font-size: var(--md-sys-typescale-title-large-font-size);
      font-weight: var(--md-sys-typescale-title-large-font-weight);
    }

    ul {
      color: var(--md-sys-color-on-surface-variant);
      line-height: 1.8;
      padding-left: 1.5rem;
    }

    li {
      margin-bottom: 0.5rem;
    }
  `;

  render() {
    return html`
      <div class="container">
        <h1>About</h1>
        <p>
          Feeding Tracker is a modern Progressive Web App designed to help
          you keep track of feeding schedules and activities.
        </p>
        <p>
          This application demonstrates a clean architecture using modern
          web technologies and standards.
        </p>

        <div class="tech-stack">
          <h2>Technology Stack</h2>
          <ul>
            <li>Lit - Fast, lightweight web components</li>
            <li>TypeScript - Type-safe development</li>
            <li>URL Pattern API - Modern routing</li>
            <li>Vite - Fast build tooling</li>
            <li>PWA - Offline-first architecture</li>
          </ul>
        </div>
      </div>
    `;
  }
}
