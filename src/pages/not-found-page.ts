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
      font-weight: var(--md-sys-typescale-label-large-font-weight);
      font-size: var(--md-sys-typescale-label-large-font-size);
      line-height: var(--md-sys-typescale-label-large-line-height);
      letter-spacing: var(--md-sys-typescale-label-large-letter-spacing);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--md-comp-button-gap);
      min-height: var(--md-comp-button-height);
      padding: 0 var(--md-comp-button-horizontal-padding);
      border-radius: var(--md-comp-button-shape);
      background: var(--md-sys-color-primary-container);
      transition:
        background-color 0.2s,
        box-shadow 0.2s,
        color 0.2s;
    }

    a:hover,
    a:focus-visible {
      background: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-primary);
      box-shadow: var(--md-sys-elevation-1);
      outline: none;
    }
  `;

  render() {
    return html`
      <div class="container">
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>The page you're looking for doesn't exist.</p>
        <a href="/">Go back home</a>
      </div>
    `;
  }
}
