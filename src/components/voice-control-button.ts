import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import {
  VoiceRecognitionService,
  voiceRecognitionService,
  type VoiceRecognitionResult,
} from '../services/voice-recognition-service.js';

@customElement('voice-control-button')
export class VoiceControlButton extends LitElement {
  static styles = css`
    :host {
      display: inline-block;
    }

    .voice-button {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 56px;
      height: 56px;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      transition: all 0.2s ease;
      background: var(--md-sys-color-secondary-container);
      color: var(--md-sys-color-on-secondary-container);
      box-shadow: var(--md-sys-elevation-2);
    }

    .voice-button:hover:not(:disabled) {
      background: var(--md-sys-color-secondary);
      color: var(--md-sys-color-on-secondary);
      box-shadow: var(--md-sys-elevation-3);
    }

    .voice-button:active:not(:disabled) {
      box-shadow: var(--md-sys-elevation-1);
    }

    .voice-button:disabled {
      background: var(--md-sys-color-surface-variant);
      color: var(--md-sys-color-on-surface-variant);
      cursor: not-allowed;
      opacity: 0.38;
    }

    .voice-button.listening {
      background: var(--md-sys-color-tertiary-container);
      color: var(--md-sys-color-on-tertiary-container);
      animation: pulse 2s ease-in-out infinite;
    }

    .voice-button.listening::before {
      content: '';
      position: absolute;
      top: -4px;
      left: -4px;
      right: -4px;
      bottom: -4px;
      border: 2px solid var(--md-sys-color-tertiary);
      border-radius: 50%;
      animation: ripple 2s ease-in-out infinite;
    }

    .voice-icon {
      width: 24px;
      height: 24px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    @keyframes pulse {
      0%,
      100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.05);
      }
    }

    @keyframes ripple {
      0% {
        opacity: 1;
        transform: scale(1);
      }
      100% {
        opacity: 0;
        transform: scale(1.3);
      }
    }

    .tooltip {
      position: absolute;
      bottom: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%);
      background: var(--md-sys-color-inverse-surface);
      color: var(--md-sys-color-inverse-on-surface);
      padding: 0.5rem 0.75rem;
      border-radius: var(--md-sys-shape-corner-small);
      font-size: var(--md-sys-typescale-body-small-font-size);
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s ease;
      z-index: 100;
    }

    .voice-button:hover .tooltip {
      opacity: 1;
    }
  `;

  @state()
  private isListening = false;

  @state()
  private isSupported = false;

  private unsubscribe: (() => void) | null = null;

  connectedCallback(): void {
    super.connectedCallback();
    this.isSupported = VoiceRecognitionService.isSupported();

    if (this.isSupported) {
      this.unsubscribe = voiceRecognitionService.onCommand(this.handleVoiceCommand);
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  private handleVoiceCommand = (result: VoiceRecognitionResult) => {
    console.debug('[voice-control-button] Voice command received:', result);

    // Dispatch custom event with the command
    this.dispatchEvent(
      new CustomEvent('voice-command', {
        detail: result,
        bubbles: true,
        composed: true,
      })
    );
  };

  private handleClick = () => {
    if (!this.isSupported) {
      return;
    }

    if (this.isListening) {
      voiceRecognitionService.stop();
      this.isListening = false;
    } else {
      voiceRecognitionService.start();
      this.isListening = true;
    }
  };

  render() {
    if (!this.isSupported) {
      return html`
        <button class="voice-button" disabled title="Voice control not supported">
          <span class="voice-icon">🎤</span>
        </button>
      `;
    }

    const tooltip = this.isListening ? 'Stop voice control' : 'Start voice control';
    const ariaLabel = this.isListening ? 'Stop listening for voice commands' : 'Start listening for voice commands';

    return html`
      <button
        class="voice-button ${this.isListening ? 'listening' : ''}"
        @click=${this.handleClick}
        aria-label=${ariaLabel}
        title=${tooltip}
      >
        <span class="voice-icon">${this.isListening ? '🎙️' : '🎤'}</span>
        <span class="tooltip">${tooltip}</span>
      </button>
    `;
  }
}
