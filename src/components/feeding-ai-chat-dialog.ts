import { LitElement, html, css } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import type { FeedingLog } from '../types/feeding-log.js';
import { acquireScrollLock, releaseScrollLock } from '../utils/dialog-scroll-lock.js';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

@customElement('feeding-ai-chat-dialog')
export class FeedingAiChatDialog extends LitElement {
  static styles = css`
    :host {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 2000;
    }

    :host([open]) {
      display: block;
    }

    .dialog-container {
      position: fixed;
      inset: 0;
      background: var(--md-sys-color-surface);
      display: flex;
      flex-direction: column;
      animation: slide-up 0.3s cubic-bezier(0.2, 0, 0, 1);
    }

    @keyframes slide-up {
      from {
        transform: translateY(100%);
      }
      to {
        transform: translateY(0);
      }
    }

    .dialog-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.5rem;
      background: var(--md-sys-color-surface-container);
      border-bottom: 1px solid var(--md-sys-color-outline-variant);
      flex-shrink: 0;
    }

    .header-title {
      flex: 1;
      margin: 0;
      color: var(--md-sys-color-on-surface);
      font-size: var(--md-sys-typescale-title-large-font-size);
      font-weight: var(--md-sys-typescale-title-large-font-weight);
      line-height: var(--md-sys-typescale-title-large-line-height);
    }

    .close-button {
      background: transparent;
      border: none;
      color: var(--md-sys-color-on-surface);
      font-size: 1.5rem;
      width: 40px;
      height: 40px;
      border-radius: var(--md-sys-shape-corner-full);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s;
    }

    .close-button:hover {
      background: var(--md-sys-color-surface-container-highest);
    }

    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .message {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      max-width: 85%;
    }

    .message--user {
      align-self: flex-end;
    }

    .message--assistant {
      align-self: flex-start;
    }

    .message__bubble {
      padding: 0.875rem 1.25rem;
      border-radius: var(--md-sys-shape-corner-large);
      font-size: var(--md-sys-typescale-body-large-font-size);
      line-height: var(--md-sys-typescale-body-large-line-height);
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .message--user .message__bubble {
      background: var(--md-sys-color-primary-container);
      color: var(--md-sys-color-on-primary-container);
      border-bottom-right-radius: 4px;
    }

    .message--assistant .message__bubble {
      background: var(--md-sys-color-surface-container-highest);
      color: var(--md-sys-color-on-surface);
      border-bottom-left-radius: 4px;
      border: 1px solid var(--md-sys-color-outline-variant);
    }

    .message__timestamp {
      font-size: var(--md-sys-typescale-body-small-font-size);
      color: var(--md-sys-color-on-surface-variant);
      padding: 0 0.5rem;
    }

    .input-container {
      padding: 1rem 1.5rem;
      background: var(--md-sys-color-surface-container);
      border-top: 1px solid var(--md-sys-color-outline-variant);
      display: flex;
      gap: 0.75rem;
      align-items: flex-end;
      flex-shrink: 0;
    }

    .input-wrapper {
      flex: 1;
      position: relative;
    }

    .message-input {
      width: 100%;
      min-height: 48px;
      max-height: 120px;
      padding: 0.75rem 1rem;
      border: 1px solid var(--md-sys-color-outline);
      border-radius: var(--md-sys-shape-corner-large);
      background: var(--md-sys-color-surface);
      color: var(--md-sys-color-on-surface);
      font-size: var(--md-sys-typescale-body-large-font-size);
      font-family: inherit;
      resize: none;
      outline: none;
      transition: border-color 0.2s;
    }

    .message-input:focus {
      border-color: var(--md-sys-color-primary);
    }

    .message-input::placeholder {
      color: var(--md-sys-color-on-surface-variant);
    }

    .send-button {
      background: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-primary);
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: var(--md-sys-shape-corner-large);
      font-size: var(--md-sys-typescale-label-large-font-size);
      font-weight: var(--md-sys-typescale-label-large-font-weight);
      cursor: pointer;
      transition: background-color 0.2s;
      height: 48px;
    }

    .send-button:hover:not(:disabled) {
      background: var(--md-sys-color-primary-container);
      color: var(--md-sys-color-on-primary-container);
    }

    .send-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .empty-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      padding: 2rem;
      text-align: center;
    }

    .empty-state__title {
      color: var(--md-sys-color-on-surface);
      font-size: var(--md-sys-typescale-headline-small-font-size);
      font-weight: var(--md-sys-typescale-headline-small-font-weight);
      margin: 0;
    }

    .empty-state__description {
      color: var(--md-sys-color-on-surface-variant);
      font-size: var(--md-sys-typescale-body-medium-font-size);
      line-height: var(--md-sys-typescale-body-medium-line-height);
      max-width: 400px;
      margin: 0;
    }

    .error-message {
      padding: 1rem;
      background: var(--md-sys-color-error-container);
      color: var(--md-sys-color-on-error-container);
      border-radius: var(--md-sys-shape-corner-large);
      font-size: var(--md-sys-typescale-body-medium-font-size);
      margin: 0 1.5rem;
    }

    .loading-indicator {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      color: var(--md-sys-color-on-surface-variant);
      font-size: var(--md-sys-typescale-body-medium-font-size);
    }

    .loading-dots {
      display: flex;
      gap: 0.25rem;
    }

    .loading-dot {
      width: 6px;
      height: 6px;
      background: var(--md-sys-color-on-surface-variant);
      border-radius: 50%;
      animation: bounce 1.4s infinite ease-in-out;
    }

    .loading-dot:nth-child(1) {
      animation-delay: -0.32s;
    }

    .loading-dot:nth-child(2) {
      animation-delay: -0.16s;
    }

    @keyframes bounce {
      0%,
      80%,
      100% {
        transform: scale(0);
        opacity: 0.5;
      }
      40% {
        transform: scale(1);
        opacity: 1;
      }
    }

    .disclaimer {
      padding: 0.75rem 1rem;
      background: var(--md-sys-color-surface-container-highest);
      border-radius: var(--md-sys-shape-corner-medium);
      font-size: var(--md-sys-typescale-body-small-font-size);
      color: var(--md-sys-color-on-surface-variant);
      margin: 0 1.5rem 1rem;
      border: 1px solid var(--md-sys-color-outline-variant);
    }
  `;

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ attribute: false })
  logs: FeedingLog[] = [];

  @state()
  private messages: ChatMessage[] = [];

  @state()
  private inputValue = '';

  @state()
  private isProcessing = false;

  @state()
  private error: string | null = null;

  @state()
  private aiMode: 'prompt-api' | 'web-llm' | 'unsupported' = 'unsupported';

  @query('.messages-container')
  private messagesContainer?: HTMLElement;

  @query('.message-input')
  private messageInput?: HTMLTextAreaElement;

  private hasScrollLock = false;
  private session: LanguageModelSession | null = null;
  private summaryHelpersModule: typeof import('../utils/feeding-ai-summary-utils.js') | null = null;
  private webLlmModule: typeof import('../utils/feeding-ai-web-llm.js') | null = null;

  connectedCallback() {
    super.connectedCallback();
    void this.checkAiAvailability();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.hasScrollLock) {
      releaseScrollLock();
      this.hasScrollLock = false;
    }
    if (this.session?.destroy) {
      this.session.destroy();
    }
    this.session = null;
  }

  updated(changedProps: Map<string, unknown>) {
    if (changedProps.has('open')) {
      if (this.open && !this.hasScrollLock) {
        acquireScrollLock();
        this.hasScrollLock = true;
      } else if (!this.open && this.hasScrollLock) {
        releaseScrollLock();
        this.hasScrollLock = false;
      }

      if (this.open) {
        this.updateComplete.then(() => {
          this.messageInput?.focus();
        });
      }
    }

    if (changedProps.has('messages')) {
      this.scrollToBottom();
    }
  }

  private async checkAiAvailability(): Promise<void> {
    if (typeof LanguageModel === 'undefined') {
      this.aiMode = 'web-llm';
      return;
    }

    try {
      const availability = await LanguageModel.availability({
        expectedInputs: [{ type: 'text', languages: ['en'] }],
        expectedOutputs: [{ type: 'text', languages: ['en'] }],
      });

      if (availability === 'unavailable') {
        this.aiMode = 'web-llm';
      } else {
        this.aiMode = 'prompt-api';
      }
    } catch (error) {
      console.warn('AI availability check failed', error);
      this.aiMode = 'web-llm';
    }
  }

  private async getSummaryHelpers() {
    if (this.summaryHelpersModule) {
      return this.summaryHelpersModule;
    }

    this.summaryHelpersModule = await import('../utils/feeding-ai-summary-utils.js');
    return this.summaryHelpersModule;
  }

  private async getWebLlmModule() {
    if (this.webLlmModule) {
      return this.webLlmModule;
    }

    this.webLlmModule = await import('../utils/feeding-ai-web-llm.js');
    return this.webLlmModule;
  }

  private buildFeedingContext(): string {
    const helpers = this.summaryHelpersModule;
    if (!helpers || this.logs.length === 0) {
      return 'No feeding logs available yet.';
    }

    return helpers.buildAiSummaryPrompt(this.logs);
  }

  private async ensureSession(): Promise<LanguageModelSession> {
    if (this.session) {
      return this.session;
    }

    if (typeof LanguageModel === 'undefined') {
      throw new Error("Chrome's built-in AI isn't available yet.");
    }

    const { AI_SYSTEM_CONTEXT } = await this.getSummaryHelpers();
    const feedingContext = this.buildFeedingContext();
    const systemPrompt = `${AI_SYSTEM_CONTEXT}\n\nYou are helping a caregiver with questions about their baby's feeding logs. Be concise, encouraging, and always remind them to consult healthcare professionals for medical advice.\n\nCurrent feeding data:\n${feedingContext}`;

    const initialPrompts: LanguageModelMessage[] = [
      { role: 'system', content: systemPrompt },
    ];

    const options: LanguageModelCreateOptions = {
      initialPrompts,
      expectedInputs: [{ type: 'text', languages: ['en'] }],
      expectedOutputs: [{ type: 'text', languages: ['en'] }],
    };

    const session = await LanguageModel.create(options);
    this.session = session;
    return session;
  }

  private async generateWithPromptApi(userMessage: string): Promise<string> {
    const session = await this.ensureSession();
    return session.prompt([{ role: 'user', content: userMessage }]);
  }

  private async generateWithWebLlm(userMessage: string): Promise<string> {
    const module = await this.getWebLlmModule();
    const { AI_SYSTEM_CONTEXT } = await this.getSummaryHelpers();
    const feedingContext = this.buildFeedingContext();
    const systemPrompt = `${AI_SYSTEM_CONTEXT}\n\nYou are helping a caregiver with questions about their baby's feeding logs. Be concise, encouraging, and always remind them to consult healthcare professionals for medical advice.\n\nCurrent feeding data:\n${feedingContext}`;

    const conversationHistory = this.messages
      .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    const fullPrompt = conversationHistory
      ? `${conversationHistory}\nUser: ${userMessage}`
      : userMessage;

    return await module.generateSummaryWithWebLlm({
      prompt: fullPrompt,
      systemContext: systemPrompt,
    });
  }

  private async handleSendMessage() {
    const message = this.inputValue.trim();
    if (!message || this.isProcessing) {
      return;
    }

    this.error = null;
    this.inputValue = '';

    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: Date.now(),
    };

    this.messages = [...this.messages, userMessage];
    this.isProcessing = true;

    try {
      let response: string;

      if (this.aiMode === 'prompt-api') {
        try {
          response = await this.generateWithPromptApi(message);
        } catch (error) {
          const promptMissing =
            typeof LanguageModel === 'undefined' ||
            (error instanceof Error && /Prompt API/i.test(error.message));
          if (!promptMissing) {
            throw error;
          }
          this.aiMode = 'web-llm';
          response = await this.generateWithWebLlm(message);
        }
      } else if (this.aiMode === 'web-llm') {
        response = await this.generateWithWebLlm(message);
      } else {
        this.aiMode = 'web-llm';
        response = await this.generateWithWebLlm(message);
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.trim(),
        timestamp: Date.now(),
      };

      this.messages = [...this.messages, assistantMessage];
    } catch (error) {
      console.error('Chat message generation failed', error);
      if (error instanceof Error) {
        this.error = error.message;
      } else {
        this.error = 'Unable to generate response right now.';
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private handleInputKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void this.handleSendMessage();
    }
  }

  private handleClose() {
    this.open = false;
    this.dispatchEvent(
      new CustomEvent('close', {
        bubbles: true,
        composed: true,
      })
    );
  }

  private scrollToBottom() {
    this.updateComplete.then(() => {
      if (this.messagesContainer) {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
      }
    });
  }

  private formatTimestamp(timestamp: number): string {
    const formatter = new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
    return formatter.format(timestamp);
  }

  render() {
    const hasMessages = this.messages.length > 0;

    return html`
      <div class="dialog-container">
        <div class="dialog-header">
          <h2 class="header-title">Chat about your feed log</h2>
          <button class="close-button" @click=${this.handleClose} aria-label="Close chat">
            ✕
          </button>
        </div>

        ${this.error
          ? html`<p class="error-message" role="alert">${this.error}</p>`
          : ''}

        ${!hasMessages
          ? html`
              <div class="empty-state">
                <h3 class="empty-state__title">Ask me anything</h3>
                <p class="empty-state__description">
                  I can help you understand your baby's feeding patterns, answer questions about
                  timing and amounts, or provide insights about the last 24 hours.
                </p>
              </div>
            `
          : html`
              <div class="messages-container">
                ${this.messages.map(
                  (msg) => html`
                    <div class="message message--${msg.role}">
                      <div class="message__bubble">${msg.content}</div>
                      <div class="message__timestamp">${this.formatTimestamp(msg.timestamp)}</div>
                    </div>
                  `
                )}
                ${this.isProcessing
                  ? html`
                      <div class="loading-indicator">
                        <span>Thinking</span>
                        <div class="loading-dots">
                          <div class="loading-dot"></div>
                          <div class="loading-dot"></div>
                          <div class="loading-dot"></div>
                        </div>
                      </div>
                    `
                  : ''}
              </div>
            `}

        ${hasMessages
          ? html`
              <p class="disclaimer">
                AI insights only - always follow guidance from your care team.
              </p>
            `
          : ''}

        <div class="input-container">
          <div class="input-wrapper">
            <textarea
              class="message-input"
              placeholder="Ask about feeding patterns, timing, amounts..."
              .value=${this.inputValue}
              @input=${(e: Event) => {
                this.inputValue = (e.target as HTMLTextAreaElement).value;
              }}
              @keydown=${this.handleInputKeydown}
              ?disabled=${this.isProcessing}
              rows="1"
            ></textarea>
          </div>
          <button
            class="send-button"
            @click=${this.handleSendMessage}
            ?disabled=${this.isProcessing || !this.inputValue.trim()}
          >
            Send
          </button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'feeding-ai-chat-dialog': FeedingAiChatDialog;
  }
}
