import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('not-found-page')
export class NotFoundPage extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 1.5rem;
      background-color: var(--md-sys-color-background);
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
      text-align: center;
    }

    h1 {
      color: var(--md-sys-color-on-background);
      font-size: var(--md-sys-typescale-display-large-font-size);
      line-height: var(--md-sys-typescale-display-large-line-height);
      font-weight: var(--md-sys-typescale-display-large-font-weight);
      margin-bottom: 0.5rem;
    }

    h2 {
      color: var(--md-sys-color-on-surface-variant);
      margin-bottom: 1.5rem;
      font-size: var(--md-sys-typescale-headline-large-font-size);
      font-weight: var(--md-sys-typescale-headline-large-font-weight);
    }

    p {
      color: var(--md-sys-color-on-surface-variant);
      margin-bottom: 2rem;
      font-size: var(--md-sys-typescale-body-large-font-size);
    }

    a {
      color: var(--md-sys-color-primary);
      text-decoration: none;
      font-weight: 500;
      padding: 0.625rem 1.5rem;
      border-radius: var(--md-sys-shape-corner-extra-large);
      background: var(--md-sys-color-primary-container);
      display: inline-block;
      transition: background-color 0.2s, box-shadow 0.2s;
    }

    a:hover {
      background: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-primary);
      box-shadow: var(--md-sys-elevation-1);
    }
  `;

  render() {
    return html`
      <div class="container">
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>
          The page you're looking for doesn't exist.
        </p>
        <a href="/">Go back home</a>
      </div>
    `;
  }
}
