import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('not-found-page')
export class NotFoundPage extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 2rem;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
      text-align: center;
    }

    h1 {
      color: #333;
      font-size: 4rem;
      margin-bottom: 0.5rem;
    }

    h2 {
      color: #666;
      margin-bottom: 1.5rem;
    }

    p {
      color: #666;
      margin-bottom: 2rem;
    }

    a {
      color: #0066cc;
      text-decoration: none;
      font-weight: 500;
    }

    a:hover {
      text-decoration: underline;
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
