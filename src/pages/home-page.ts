import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('home-page')
export class HomePage extends LitElement {
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
      margin-bottom: 1.5rem;
    }

    .card {
      background: #f5f5f5;
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 1rem;
    }

    .card h2 {
      margin-top: 0;
      color: #444;
    }
  `;

  render() {
    return html`
      <div class="container">
        <h1>Welcome to Feeding Tracker</h1>
        <p>
          This is a Progressive Web App built with Lit web components.
          Track feeding times and activities with ease.
        </p>
        
        <div class="card">
          <h2>Getting Started</h2>
          <p>
            This app uses a custom router based on the URL Pattern API.
            Navigate between pages using the links in the navigation.
          </p>
        </div>

        <div class="card">
          <h2>Features</h2>
          <ul>
            <li>Built with Lit web components</li>
            <li>Custom router using URL Pattern API</li>
            <li>Progressive Web App capabilities</li>
            <li>Offline support</li>
          </ul>
        </div>
      </div>
    `;
  }
}
