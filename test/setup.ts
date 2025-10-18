// Setup file for Vitest tests
import { beforeEach, vi } from 'vitest';
import 'urlpattern-polyfill';

// Mock the File System Access API for testing
beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();

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
