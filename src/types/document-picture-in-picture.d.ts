/**
 * TypeScript definitions for Document Picture-in-Picture API
 * @see https://developer.chrome.com/docs/web-platform/document-picture-in-picture
 */

interface DocumentPictureInPictureOptions {
  width?: number;
  height?: number;
  disallowReturnToOpener?: boolean;
}

interface DocumentPictureInPicture extends EventTarget {
  requestWindow(options?: DocumentPictureInPictureOptions): Promise<Window>;
  readonly window: Window | null;
}

interface WindowEventMap {
  pagehide: PageTransitionEvent;
}

declare global {
  interface Window {
    documentPictureInPicture?: DocumentPictureInPicture;
  }
}

export {};
