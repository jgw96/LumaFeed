const SCROLL_LOCK_CLASS = 'dialog-scroll-locked';
let lockCount = 0;

const getRootElement = () => {
  if (typeof document === 'undefined') {
    return undefined;
  }
  return document.documentElement;
};

export const acquireScrollLock = () => {
  const root = getRootElement();
  if (!root) {
    return;
  }
  lockCount += 1;
  if (lockCount === 1) {
    root.classList.add(SCROLL_LOCK_CLASS);
  }
};

export const releaseScrollLock = () => {
  const root = getRootElement();
  if (!root || lockCount === 0) {
    return;
  }
  lockCount -= 1;
  if (lockCount === 0) {
    root.classList.remove(SCROLL_LOCK_CLASS);
  }
};
