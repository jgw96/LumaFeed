import { LitElement } from 'lit';
import { query } from 'lit/decorators.js';
import { acquireScrollLock, releaseScrollLock } from '../utils/dialog-scroll-lock.js';

/**
 * Shared modal dialog behavior with optional scroll locking and animation handling.
 */
export abstract class BaseModalDialog extends LitElement {
  @query('dialog')
  protected dialog?: HTMLDialogElement;

  private isClosing = false;
  private closeTimeoutId: number | null = null;
  private animationEndHandler?: (event: AnimationEvent) => void;
  private transitionEndHandler?: (event: TransitionEvent) => void;
  private hasScrollLock = false;
  private resetPending = false;

  protected abstract resetDialogState(): void;
  protected onBeforeOpen(): void {}
  protected onAfterOpen(): void {}
  protected onBeforeClose(): void {}
  protected onAfterClose(): void {}
  protected get enableScrollLock(): boolean {
    return true;
  }

  public open(): void {
    if (!this.dialog) {
      this.updateComplete
        .then(() => {
          if (this.dialog) {
            this.open();
          }
        })
        .catch(() => {});
      return;
    }

    this.cancelPendingClose();
    this.onBeforeOpen();
    this.resetDialogState();

    if (this.enableScrollLock) {
      this.lockScroll();
    }

    if (!this.dialog.open) {
      this.dialog.showModal();
    }

    this.updateComplete
      .then(() => {
        this.onAfterOpen();
      })
      .catch(() => {});
  }

  public close(): void {
    this.onBeforeClose();
    const dialog = this.dialog;

    if (!dialog) {
      this.isClosing = false;
      this.clearClosingHandlers();
      this.unlockScroll();
      this.scheduleResetDialogState();
      this.onAfterClose();
      return;
    }

    if (!dialog.open) {
      dialog.classList.remove('closing');
      this.isClosing = false;
      this.clearClosingHandlers();
      this.unlockScroll();
      this.scheduleResetDialogState();
      this.onAfterClose();
      return;
    }

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      dialog.classList.remove('closing');
      this.isClosing = false;
      this.clearClosingHandlers();
      if (dialog.open) {
        dialog.close();
      }
      this.unlockScroll();
      this.scheduleResetDialogState();
      this.onAfterClose();
      return;
    }

    if (this.isClosing) {
      return;
    }

    this.isClosing = true;
    dialog.classList.add('closing');

    const finishClose = () => {
      if (!this.isClosing) {
        return;
      }

      this.isClosing = false;
      this.clearClosingHandlers();
      dialog.classList.remove('closing');
      if (dialog.open) {
        dialog.close();
      }
      this.unlockScroll();
      this.scheduleResetDialogState();
      this.onAfterClose();
    };

    const onAnimationEnd = (event: AnimationEvent) => {
      if (event.target !== dialog) {
        return;
      }
      finishClose();
    };

    const onTransitionEnd = (event: TransitionEvent) => {
      if (event.target !== dialog) {
        return;
      }
      finishClose();
    };

    this.animationEndHandler = onAnimationEnd;
    this.transitionEndHandler = onTransitionEnd;

    dialog.addEventListener('animationend', onAnimationEnd);
    dialog.addEventListener('transitionend', onTransitionEnd);

    this.closeTimeoutId = window.setTimeout(() => {
      finishClose();
    }, 250);
  }

  protected scheduleResetDialogState(): void {
    if (this.resetPending) {
      return;
    }

    this.resetPending = true;
    queueMicrotask(() => {
      if (!this.resetPending) {
        return;
      }
      this.resetPending = false;
      this.resetDialogState();
    });
  }

  protected cancelPendingClose(): void {
    this.resetPending = false;
    this.clearClosingHandlers();
    this.isClosing = false;
    if (this.dialog) {
      this.dialog.classList.remove('closing');
    }
  }

  private lockScroll(): void {
    if (this.hasScrollLock) {
      return;
    }
    acquireScrollLock();
    this.hasScrollLock = true;
  }

  private unlockScroll(): void {
    if (!this.hasScrollLock) {
      return;
    }
    releaseScrollLock();
    this.hasScrollLock = false;
  }

  private clearClosingHandlers(): void {
    if (this.closeTimeoutId !== null) {
      window.clearTimeout(this.closeTimeoutId);
      this.closeTimeoutId = null;
    }

    const dialog = this.dialog;
    if (!dialog) {
      this.animationEndHandler = undefined;
      this.transitionEndHandler = undefined;
      return;
    }

    if (this.animationEndHandler) {
      dialog.removeEventListener('animationend', this.animationEndHandler);
      this.animationEndHandler = undefined;
    }

    if (this.transitionEndHandler) {
      dialog.removeEventListener('transitionend', this.transitionEndHandler);
      this.transitionEndHandler = undefined;
    }
  }

  disconnectedCallback(): void {
    this.clearClosingHandlers();
    this.resetPending = false;
    this.unlockScroll();
    super.disconnectedCallback();
  }
}

