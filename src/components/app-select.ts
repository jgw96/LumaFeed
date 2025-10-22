import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

export interface SelectOption {
  label: string;
  value: string;
  helperText?: string;
}

@customElement('app-select')
export class AppSelect extends LitElement {
  static styles = css`
    :host {
      display: block;
      position: relative;
      font-family: var(--md-sys-typescale-body-large-font-family, inherit);
    }

    :host([disabled]) {
      pointer-events: none;
      opacity: 0.6;
    }

    .trigger {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 0.85rem 1rem;
      border: 1px solid var(--md-sys-color-outline);
      border-radius: var(--md-sys-shape-corner-medium);
      background: var(--md-sys-color-surface-container-low);
      color: var(--md-sys-color-on-surface);
      font-size: var(--md-sys-typescale-body-large-font-size);
      cursor: pointer;
      transition:
        border-color 0.2s,
        box-shadow 0.2s,
        background-color 0.2s;
    }

    .trigger:focus-visible {
      outline: none;
      border-color: var(--md-sys-color-primary);
      box-shadow: 0 0 0 2px var(--md-sys-color-primary-container);
      background: var(--md-sys-color-surface);
    }

    .trigger.open {
      border-color: var(--md-sys-color-primary);
      background: var(--md-sys-color-surface);
      box-shadow: 0 0 0 2px var(--md-sys-color-primary-container);
    }

    .selected-label {
      flex: 1 1 auto;
      text-align: left;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .indicator {
      display: inline-flex;
      width: 1rem;
      height: 1rem;
      align-items: center;
      justify-content: center;
      color: var(--md-sys-color-on-surface-variant);
      transition: transform 0.2s ease;
    }

    .trigger.open .indicator {
      transform: rotate(-180deg);
    }

    .menu {
      position: absolute;
      top: calc(100% + 0.375rem);
      left: 0;
      right: 0;
      background: var(--md-sys-color-surface-container-high);
      border: 1px solid var(--md-sys-color-outline-variant);
      border-radius: var(--md-sys-shape-corner-medium);
      box-shadow: var(--md-sys-elevation-2);
      padding: 0.375rem;
      z-index: 10;
      max-height: 280px;
      overflow-y: auto;
    }

    .option {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 0.65rem 0.875rem;
      margin: 0.125rem;
      border-radius: var(--md-sys-shape-corner-small);
      cursor: pointer;
      color: var(--md-sys-color-on-surface);
      transition:
        background-color 0.15s ease,
        color 0.15s ease;
    }

    .option-labels {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      min-width: 0;
    }

    .option-label {
      font-size: var(--md-sys-typescale-body-large-font-size);
      font-weight: var(--md-sys-typescale-body-large-font-weight, 500);
      line-height: 1.2;
    }

    .option[aria-selected='true'] .option-label {
      font-weight: var(--md-sys-typescale-title-small-font-weight);
    }

    .helper-text {
      font-size: var(--md-sys-typescale-body-small-font-size);
      color: var(--md-sys-color-on-surface-variant);
      opacity: 0.9;
    }

    .option:hover,
    .option.active {
      background: var(--md-sys-color-primary-container);
      color: var(--md-sys-color-on-primary-container);
    }

    .option:hover .helper-text,
    .option.active .helper-text {
      color: var(--md-sys-color-on-primary-container);
      opacity: 0.8;
    }

    .option[aria-selected='true']:not(.active) {
      background: var(--md-sys-color-surface-container-highest);
    }

    .check-icon {
      width: 1.25rem;
      height: 1.25rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--md-sys-color-primary);
      opacity: 0;
      transform: scale(0.85);
      transition:
        opacity 0.15s ease,
        transform 0.2s ease,
        color 0.15s ease;
      flex-shrink: 0;
    }

    .check-icon[data-visible='true'] {
      opacity: 1;
      transform: scale(1);
    }

    .option:hover .check-icon,
    .option.active .check-icon {
      color: var(--md-sys-color-on-primary-container);
    }

    @media (prefers-reduced-motion: reduce) {
      .trigger,
      .indicator,
      .option {
        transition: none;
      }
    }
  `;

  @property({ type: Array })
  options: SelectOption[] = [];

  @property({ type: String })
  value = '';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: String, attribute: 'placeholder' })
  placeholder: string | null = null;

  @property({ type: String, attribute: 'aria-label' })
  ariaLabel: string | null = null;

  @property({ type: String, attribute: 'aria-labelledby' })
  ariaLabelledby: string | null = null;

  @state()
  private open = false;

  @state()
  private activeIndex = -1;

  private outsideController: AbortController | null = null;

  private get hostId(): string {
    return this.id || 'app-select';
  }

  private get triggerId(): string {
    return `${this.hostId}-trigger`;
  }

  private get listboxId(): string {
    return `${this.hostId}-listbox`;
  }

  private get selectedIndex(): number {
    return this.options.findIndex(option => option.value === this.value);
  }

  private get activeOptionId(): string | null {
    if (this.activeIndex < 0 || this.activeIndex >= this.options.length) {
      return null;
    }

    return `${this.hostId}-option-${this.activeIndex}`;
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has('options') || changed.has('value')) {
      const selected = this.selectedIndex;
      this.activeIndex = selected >= 0 ? selected : this.options.length ? 0 : -1;
    }

    if (changed.has('open') && this.open) {
      this.setupOutsideClick();
    }

    if (changed.has('open') && !this.open) {
      this.cleanupOutsideClick();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.cleanupOutsideClick();
  }

  private setupOutsideClick() {
    this.cleanupOutsideClick();
    this.outsideController = new AbortController();
    const signal = this.outsideController.signal;
    window.addEventListener(
      'pointerdown',
      event => {
        const path = event.composedPath();
        if (!path.includes(this)) {
          this.closeMenu();
        }
      },
      { capture: true, signal }
    );
  }

  private cleanupOutsideClick() {
    if (this.outsideController) {
      this.outsideController.abort();
      this.outsideController = null;
    }
  }

  private toggleMenu() {
    if (this.disabled) return;
    if (this.open) {
      this.closeMenu(true);
    } else {
      this.openMenu();
    }
  }

  private openMenu() {
    if (this.disabled) return;
    const selected = this.selectedIndex;
    this.activeIndex = selected >= 0 ? selected : this.options.length ? 0 : -1;
    this.open = true;
    this.updateComplete.then(() => {
      const activeId = this.activeOptionId;
      if (!activeId) return;
      const activeEl = this.shadowRoot?.getElementById(activeId);
      activeEl?.scrollIntoView({ block: 'nearest' });
    });
  }

  private closeMenu(focusTrigger = false) {
    const wasOpen = this.open;
    if (!wasOpen && !focusTrigger) {
      return;
    }
    this.open = false;
    if (focusTrigger) {
      this.updateComplete.then(() => {
        const trigger = this.shadowRoot?.getElementById(this.triggerId) as
          | HTMLButtonElement
          | null;
        trigger?.focus();
      });
    }
  }

  private moveActive(delta: number) {
    if (!this.options.length) return;
    const next = this.activeIndex + delta;
    if (next < 0) {
      this.activeIndex = this.options.length - 1;
    } else if (next >= this.options.length) {
      this.activeIndex = 0;
    } else {
      this.activeIndex = next;
    }
  }

  private handleTriggerKeydown(event: KeyboardEvent) {
    if (this.disabled) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!this.open) {
          this.openMenu();
        }
        this.moveActive(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (!this.open) {
          this.openMenu();
        }
        this.moveActive(-1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!this.open) {
          this.openMenu();
        } else {
          this.commitActiveOption();
        }
        break;
      case 'Escape':
        if (this.open) {
          event.preventDefault();
          this.closeMenu(true);
        }
        break;
      case 'Home':
        event.preventDefault();
        this.activeIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        this.activeIndex = this.options.length - 1;
        break;
      case 'Tab':
        this.closeMenu();
        break;
      default:
        break;
    }
  }

  private commitActiveOption() {
    if (this.activeIndex < 0 || this.activeIndex >= this.options.length) {
      return;
    }

    this.setValue(this.options[this.activeIndex].value);
  }

  private handleOptionClick(index: number) {
    this.setValue(this.options[index].value);
  }

  private setValue(value: string) {
    if (this.value !== value) {
      this.value = value;
      this.dispatchEvent(
        new Event('change', {
          bubbles: true,
          composed: true,
        })
      );
    }
    this.closeMenu(true);
  }

  private renderSelectedLabel() {
    const selected = this.options.find(option => option.value === this.value);
    if (selected) {
      return selected.label;
    }
    return this.placeholder ?? 'Select an option';
  }

  render() {
    const listboxId = this.listboxId;
    const activeId = this.open ? this.activeOptionId : null;

    return html`
      <button
        id=${this.triggerId}
        class=${`trigger${this.open ? ' open' : ''}`}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded=${this.open ? 'true' : 'false'}
        aria-controls=${listboxId}
        aria-activedescendant=${activeId || nothing}
        aria-disabled=${this.disabled ? 'true' : 'false'}
        aria-label=${this.ariaLabel || nothing}
        aria-labelledby=${this.ariaLabel ? nothing : this.ariaLabelledby || nothing}
        @click=${this.toggleMenu}
        @keydown=${this.handleTriggerKeydown}
      >
        <span class="selected-label">${this.renderSelectedLabel()}</span>
        <span class="indicator" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" focusable="false">
            <path
              fill="currentColor"
              d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6l-6-6l1.41-1.41Z"
            ></path>
          </svg>
        </span>
      </button>
      ${this.open
        ? html`
            <div
              class="menu"
              role="listbox"
              id=${listboxId}
              aria-labelledby=${this.ariaLabel ? nothing : this.ariaLabelledby || nothing}
              aria-label=${this.ariaLabel || nothing}
            >
              ${this.options.map((option, index) => {
                const optionId = `${this.hostId}-option-${index}`;
                const isSelected = this.value === option.value;
                const isActive = this.activeIndex === index;
                return html`
                  <div
                    id=${optionId}
                    role="option"
                    class="option ${isActive ? 'active' : ''}"
                    aria-selected=${isSelected ? 'true' : 'false'}
                    @click=${() => this.handleOptionClick(index)}
                    @mouseenter=${() => (this.activeIndex = index)}
                  >
                    <div class="option-labels">
                      <span class="option-label">${option.label}</span>
                      ${option.helperText
                        ? html`<span class="helper-text">${option.helperText}</span>`
                        : nothing}
                    </div>
                    <span
                      class="check-icon"
                      data-visible=${isSelected ? 'true' : 'false'}
                      aria-hidden="true"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" focusable="false">
                        <path
                          fill="currentColor"
                          d="M9.55 17L5 12.45l1.4-1.4l3.15 3.15l7.1-7.1l1.4 1.4Z"
                        ></path>
                      </svg>
                    </span>
                  </div>
                `;
              })}
            </div>
          `
        : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-select': AppSelect;
  }
}
