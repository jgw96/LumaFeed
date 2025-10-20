import { css } from 'lit';

/**
 * Shared styling primitives for dialog components to reduce visual drift.
 */
export const dialogHeaderStyles = css`
  .dialog-header {
    display: grid;
    gap: 0.5rem;
    background: var(--md-sys-color-surface);
    color: var(--md-sys-color-on-surface);
    padding: 1.5rem;
    border-radius: var(--md-sys-shape-corner-extra-large) var(--md-sys-shape-corner-extra-large) 0 0;
  }

  .dialog-header h2 {
    margin: 0;
    font-size: var(--md-sys-typescale-headline-large-font-size);
    font-weight: var(--md-sys-typescale-headline-large-font-weight);
    line-height: var(--md-sys-typescale-headline-large-line-height);
  }

  .dialog-header .subtitle,
  .dialog-header p {
    margin: 0;
    color: var(--md-sys-color-on-surface-variant);
    font-size: var(--md-sys-typescale-body-medium-font-size);
    line-height: var(--md-sys-typescale-body-medium-line-height);
  }
`;

export const dialogCancelButtonStyles = css`
  .dialog-cancel-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--md-comp-button-gap);
    min-height: var(--md-comp-button-height);
    padding: 0 var(--md-comp-button-horizontal-padding);
    border: none;
    border-radius: var(--md-sys-shape-corner-full);
    background: transparent;
    color: var(--md-sys-color-primary);
    font-size: var(--md-sys-typescale-label-large-font-size);
    font-weight: var(--md-sys-typescale-label-large-font-weight);
    line-height: var(--md-sys-typescale-label-large-line-height);
    letter-spacing: var(--md-sys-typescale-label-large-letter-spacing);
    cursor: pointer;
    transition:
      background-color 0.2s ease,
      color 0.2s ease;
  }

  .dialog-cancel-button:hover,
  .dialog-cancel-button:focus-visible {
    background: color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent);
    color: var(--md-sys-color-primary);
    outline: none;
  }

  .dialog-cancel-button:disabled {
    opacity: 0.38;
    cursor: not-allowed;
  }
`;
