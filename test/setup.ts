// Setup file for Vitest tests
import { beforeEach, vi } from 'vitest';
import 'urlpattern-polyfill';

const createMockMatchMedia = (matches = false): MediaQueryList => {
  return {
    matches,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent() {
      return false;
    },
  } as MediaQueryList;
};

const setDefaultMatchMedia = () => {
  if (typeof window === 'undefined') {
    return;
  }

  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string) => createMockMatchMedia(false),
  });
};

const ensureMatchMedia = () => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    setDefaultMatchMedia();
  } catch {
    try {
      (window as any).matchMedia = (query: string) => createMockMatchMedia(false);
    } catch {
      // Unable to override, rely on existing implementation.
    }
  }
};

ensureMatchMedia();

// Mock the File System Access API for testing
beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();

  ensureMatchMedia();

  // Mock navigator.storage.getDirectory for feeding storage service
  if (!navigator.storage) {
    Object.defineProperty(navigator, 'storage', {
      value: {},
      writable: true,
      configurable: true,
    });
  }

  const mockFileData = new Map<string, string>();

  Object.defineProperty(navigator.storage, 'getDirectory', {
    value: vi.fn().mockResolvedValue({
      getFileHandle: vi
        .fn()
        .mockImplementation((fileName: string, options?: { create?: boolean }) => {
          return Promise.resolve({
            getFile: vi.fn().mockResolvedValue({
              text: vi.fn().mockResolvedValue(mockFileData.get(fileName) || ''),
            }),
            createWritable: vi.fn().mockResolvedValue({
              write: vi.fn().mockImplementation((data: string) => {
                mockFileData.set(fileName, data);
                return Promise.resolve();
              }),
              close: vi.fn().mockResolvedValue(undefined),
            }),
          });
        }),
    }),
    writable: true,
    configurable: true,
  });

  // Mock crypto.randomUUID for consistent IDs in tests
  if (!crypto.randomUUID) {
    let idCounter = 0;
    crypto.randomUUID = () => `test-id-${idCounter++}`;
  }
});
