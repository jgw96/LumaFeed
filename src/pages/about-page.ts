import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('about-page')
export class AboutPage extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 2rem;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
    }

    h1 {
      color: #333;
      margin-bottom: 1rem;
    }

    p {
      color: #666;
      line-height: 1.6;
      margin-bottom: 1rem;
    }

    .tech-stack {
      background: #f5f5f5;
      border-radius: 8px;
      padding: 1.5rem;
      margin-top: 2rem;
    }

    .tech-stack h2 {
      margin-top: 0;
      color: #444;
    }

    ul {
      color: #666;
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
