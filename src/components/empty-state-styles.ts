import { css } from 'lit';

export const emptyStateStyles = css`
  .empty-state {
    text-align: center;
    padding: 3rem 1.5rem;
    color: var(--md-sys-color-on-surface);
    background: var(--md-sys-color-surface-container-low);
    border-radius: var(--md-sys-shape-corner-large);
    display: grid;
    gap: 1.5rem;
    max-width: 420px;
    margin: 0 auto;
  }

  .empty-state-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.7;
  }

  .empty-state-title {
    font-size: var(--md-sys-typescale-headline-small-font-size);
    font-weight: var(--md-sys-typescale-headline-small-font-weight);
    line-height: var(--md-sys-typescale-headline-small-line-height);
    color: var(--md-sys-color-on-surface);
  }

  .empty-state-description {
    color: var(--md-sys-color-on-surface-variant);
    font-size: var(--md-sys-typescale-body-medium-font-size);
    line-height: var(--md-sys-typescale-body-medium-line-height);
    margin: 0;
  }

  .empty-state-highlights {
    display: grid;
    gap: 1rem;
    padding: 0;
    margin: 0;
    list-style: none;
    text-align: left;
  }

  .highlight-item {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.75rem;
    align-items: start;
    background: color-mix(in srgb, var(--md-sys-color-surface) 70%, transparent);
    border: 1px dashed color-mix(in srgb, var(--md-sys-color-outline-variant) 60%, transparent);
    border-radius: var(--md-sys-shape-corner-medium);
    padding: 0.75rem 1rem;
  }

  .highlight-icon {
    font-size: 1.5rem;
    line-height: 1;
    color: var(--md-sys-color-primary);
  }

  .highlight-title {
    font-weight: 600;
    margin-bottom: 0.25rem;
    color: var(--md-sys-color-on-surface);
    font-size: var(--md-sys-typescale-label-large-font-size);
  }

  .highlight-copy {
    color: var(--md-sys-color-on-surface-variant);
    font-size: var(--md-sys-typescale-body-small-font-size);
    margin: 0;
  }

  .empty-state-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--md-comp-button-gap);
    min-height: var(--md-comp-button-height);
    padding: 0 var(--md-comp-button-horizontal-padding);
    border: none;
    border-radius: var(--md-comp-button-shape);
    background: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
    font-weight: var(--md-sys-typescale-label-large-font-weight);
    font-size: var(--md-sys-typescale-label-large-font-size);
    line-height: var(--md-sys-typescale-label-large-line-height);
    letter-spacing: var(--md-sys-typescale-label-large-letter-spacing);
    cursor: pointer;
    transition:
      background-color 0.2s,
      box-shadow 0.2s;
    box-shadow: var(--md-sys-elevation-1);
  }

  .empty-state-action:hover,
  .empty-state-action:focus-visible {
    background: var(--md-sys-color-primary-container);
    color: var(--md-sys-color-on-primary-container);
    box-shadow: var(--md-sys-elevation-2);
    outline: none;
  }

  .empty-state-footer {
    color: var(--md-sys-color-on-surface-variant);
    font-size: var(--md-sys-typescale-body-small-font-size);
    margin: 0;
  }
`;
