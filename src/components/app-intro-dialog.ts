import { html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { BaseModalDialog } from './base-modal-dialog.js';
import { markIntroExperienceCompleted } from '../utils/intro-experience.js';

type IntroHighlight = {
  title: string;
  description: string;
  icon: string;
};

@customElement('app-intro-dialog')
export class AppIntroDialog extends BaseModalDialog {
  static styles = css`
    :host {
      display: block;
      z-index: 99999;
    }

    dialog {
      border: none;
      border-radius: var(--md-sys-shape-corner-extra-large);
      padding: 0;
      margin: auto;
      background: var(--md-sys-color-surface-container-high);
      color: var(--md-sys-color-on-surface);
      width: min(720px, calc(100vw - 2.5rem));
      box-shadow: var(--md-sys-elevation-4);
      opacity: 0;
      transform: translateY(24px) scale(0.98);
      transition:
        opacity 260ms cubic-bezier(0.2, 0.8, 0.2, 1),
        transform 280ms cubic-bezier(0.2, 0.8, 0.2, 1);
      overflow: hidden;
      max-height: calc(100dvh - 3rem);
      display: flex;
      flex-direction: column;

      z-index: 9999;
    }

    dialog[open] {
      opacity: 1;
      transform: translateY(0) scale(1);
    }

    dialog.closing {
      opacity: 0;
      transform: translateY(32px) scale(0.95);
    }

    dialog::backdrop {
      background: color-mix(in srgb, black 35%, transparent);
      backdrop-filter: blur(18px);
    }

    .intro-layout {
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
      padding: 2rem 2.5rem;
      overflow-y: auto;
    }

    .hero {
      position: relative;
      padding: 2.25rem 2rem;
      border-radius: var(--md-sys-shape-corner-extra-large);
      background: linear-gradient(160deg, var(--md-sys-color-primary) 0%, #5ab1f8 60%, #a2d9ff 100%);
      color: var(--md-sys-color-on-primary);
      box-shadow: inset 0 0 0 1px color-mix(in srgb, white 12%, transparent);
    }

    .hero::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: var(--md-sys-shape-corner-extra-large);
      background: radial-gradient(circle at top right, rgba(255, 255, 255, 0.35), transparent 55%);
      pointer-events: none;
    }

    .hero__label {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: color-mix(in srgb, var(--md-sys-color-on-primary) 18%, transparent);
      color: inherit;
      padding: 0.35rem 0.85rem;
      border-radius: 999px;
      font-size: var(--md-sys-typescale-label-medium-font-size);
      font-weight: var(--md-sys-typescale-label-medium-font-weight);
      letter-spacing: var(--md-sys-typescale-label-medium-letter-spacing);
      margin-bottom: 1.5rem;
      position: relative;
      z-index: 1;
    }

    .hero__title {
      font-size: clamp(1.75rem, 4vw, 2.5rem);
      font-weight: 700;
      line-height: 1.15;
      margin: 0 0 0.75rem 0;
      position: relative;
      z-index: 1;
    }

    .hero__description {
      margin: 0;
      font-size: var(--md-sys-typescale-body-large-font-size);
      line-height: var(--md-sys-typescale-body-large-line-height);
      opacity: 0.9;
      max-width: 34ch;
      position: relative;
      z-index: 1;
    }

    .highlights {
      display: grid;
      gap: 1.25rem;
    }

    .highlight {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 1rem;
      padding: 1.25rem 1.5rem;
      border-radius: var(--md-sys-shape-corner-large);
      background: var(--md-sys-color-surface-container-low);
      color: var(--md-sys-color-on-surface);
      border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 65%, transparent);
      box-shadow: var(--md-sys-elevation-1);
    }

    .highlight__icon {
      width: 48px;
      height: 48px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      background: color-mix(in srgb, var(--md-sys-color-primary) 14%, transparent);
      color: var(--md-sys-color-primary);
    }

    .highlight__title {
      margin: 0 0 0.35rem 0;
      font-size: var(--md-sys-typescale-title-small-font-size);
      font-weight: var(--md-sys-typescale-title-small-font-weight);
      letter-spacing: var(--md-sys-typescale-title-small-letter-spacing);
    }

    .highlight__description {
      margin: 0;
      color: var(--md-sys-color-on-surface-variant);
      font-size: var(--md-sys-typescale-body-medium-font-size);
      line-height: var(--md-sys-typescale-body-medium-line-height);
    }

    .actions {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 2.5rem 2rem;
      border-top: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 50%, transparent);
      background: linear-gradient(
        180deg,
        color-mix(in srgb, var(--md-sys-color-surface-container-high) 85%, transparent) 0%,
        var(--md-sys-color-surface-container-high) 48%,
        var(--md-sys-color-surface-container-high) 100%
      );
    }

    .actions__meta {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      color: var(--md-sys-color-on-surface-variant);
      font-size: var(--md-sys-typescale-body-small-font-size);
    }

    .actions__buttons {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .text-button,
    .filled-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0 1.25rem;
      min-height: var(--md-comp-button-height);
      border-radius: var(--md-comp-button-shape);
      border: none;
      cursor: pointer;
      font-size: var(--md-sys-typescale-label-large-font-size);
      font-weight: var(--md-sys-typescale-label-large-font-weight);
      letter-spacing: var(--md-sys-typescale-label-large-letter-spacing);
      transition:
        background-color 0.2s ease,
        color 0.2s ease,
        box-shadow 0.2s ease;
    }

    .text-button {
      background: transparent;
      color: var(--md-sys-color-primary);
    }

    .text-button:hover,
    .text-button:focus-visible {
      background: color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent);
      outline: none;
    }

    .filled-button {
      background: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-primary);
      box-shadow: var(--md-sys-elevation-1);
    }

    .filled-button:hover,
    .filled-button:focus-visible {
      background: var(--md-sys-color-primary-container);
      color: var(--md-sys-color-on-primary-container);
      box-shadow: var(--md-sys-elevation-2);
      outline: none;
    }

    @media (min-width: 600px) {
      .intro-layout {
        padding: 2.5rem 3rem 2rem;
      }

      .highlights {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .highlight {
        grid-template-columns: 1fr;
        grid-auto-rows: max-content;
        align-items: flex-start;
      }

      .highlight__icon {
        width: 56px;
        height: 56px;
        font-size: 28px;
      }
    }

    @media (max-width: 599px) {
      dialog {
        width: 100vw;
        max-width: 100vw;
        height: 100dvh;
        max-height: none;
        border-radius: 0;
        margin: 0;
      }

      .intro-layout {
        padding: 1.75rem 1.5rem 1.5rem;
      }

      .hero {
        padding: 1.75rem 1.5rem;
      }

      .actions {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
        padding: 1.5rem 1.5rem 1.75rem;
      }

      .actions__buttons {
        justify-content: stretch;
      }

      .text-button,
      .filled-button {
        width: 100%;
      }
    }
  `;

  private readonly highlights: IntroHighlight[] = [
    {
      title: 'Track every feed',
      description: 'Log nursing sessions or bottles with timers, reminders, and quick presets.',
      icon: '🍼',
    },
    {
      title: 'Understand the rhythm',
      description: 'See trends, next feed predictions, and AI summaries built for sleep-deprived parents.',
      icon: '✨',
    },
    {
      title: 'Keep diapers in check',
      description: 'Record changes in seconds so you and your pediatrician stay aligned.',
      icon: '🧷',
    },
  ];

  protected resetDialogState(): void {
    // Nothing to reset right now, but keep method for future onboarding steps.
  }

  protected onAfterClose(): void {
    this.dispatchEvent(
      new CustomEvent('intro-dialog-closed', {
        bubbles: true,
        composed: true,
      })
    );
  }

  private handleCancel(event: Event): void {
    event.preventDefault();
    this.emitDismissed();
    this.close();
  }

  private handleStartClick(): void {
    markIntroExperienceCompleted();
    this.dispatchEvent(
      new CustomEvent('intro-complete', {
        bubbles: true,
        composed: true,
      })
    );
    this.close();
  }

  private emitDismissed(): void {
    this.dispatchEvent(
      new CustomEvent('intro-dismissed', {
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    return html`
      <dialog @cancel=${this.handleCancel} aria-labelledby="intro-dialog-title" aria-modal="true">
        <div class="intro-layout">
          <section class="hero">
            <span class="hero__label">
              <span aria-hidden="true">🌙</span>
              Welcome!
            </span>
            <h1 id="intro-dialog-title" class="hero__title">Meet LumaFeed</h1>
            <p class="hero__description">
              A calmer way to track feedings, diapers, and the little signals that matter most in the
              first months.
            </p>
          </section>

          <section class="highlights" aria-label="Why parents love LumaFeed">
            ${this.highlights.map(
              (highlight) => html`
                <article class="highlight">
                  <div class="highlight__icon" aria-hidden="true">${highlight.icon}</div>
                  <div>
                    <h2 class="highlight__title">${highlight.title}</h2>
                    <p class="highlight__description">${highlight.description}</p>
                  </div>
                </article>
              `
            )}
          </section>
        </div>

        <div class="actions">
          <div class="actions__meta">
            <span>We keep everything private and on your device.</span>
            <span>No ads, no trackers — just the data that matters to your family.</span>
          </div>
          <div class="actions__buttons">
            <button class="filled-button" type="button" @click=${this.handleStartClick}>
              Get started
            </button>
          </div>
        </div>
      </dialog>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-intro-dialog': AppIntroDialog;
  }
}
