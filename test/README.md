# E2E Testing with Vitest

This directory contains end-to-end tests for the Feeding Tracker application using Vitest.

## Test Structure

```
test/
├── setup.ts                      # Test setup and global mocks
├── helpers.ts                    # Test utility functions
├── router.test.ts                # Router functionality tests
├── app-root.test.ts              # Main app component tests
├── home-page.test.ts             # Home page component tests
├── about-page.test.ts            # About page component tests
├── not-found-page.test.ts        # 404 page component tests
├── feeding-form-dialog.test.ts   # Feeding form dialog component tests
└── feeding-log-list.test.ts      # Feeding log list component tests
```

## Running Tests

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Test Coverage

The test suite covers:

### Router Tests (`router.test.ts`)
- Route initialization
- Route matching (home, about, 404)
- Navigation between routes
- Route change listeners
- Unsubscribing from route changes

### App Root Tests (`app-root.test.ts`)
- Header rendering
- Navigation links
- Default route rendering (home page)
- Navigation between pages
- Active link styling
- 404 page rendering for invalid routes

### Home Page Tests (`home-page.test.ts`)
- Page rendering
- Add feeding button
- Loading state
- Feeding log list display
- Dialog interaction
- Log addition handling
- Log deletion handling

### About Page Tests (`about-page.test.ts`)
- Page rendering
- Description content
- Technology stack section
- Technology list display

### Not Found Page Tests (`not-found-page.test.ts`)
- 404 message display
- Home link rendering

### Feeding Form Dialog Tests (`feeding-form-dialog.test.ts`)
- Dialog rendering
- Feed type selection (formula/milk)
- Amount input
- Unit selection (ml/oz)
- Duration input
- Feeding method selection
- Form validation
- Dialog open/close functionality
- Form submission and event dispatching

### Feeding Log List Tests (`feeding-log-list.test.ts`)
- Empty state rendering
- Log item display
- Feed type display (formula/milk)
- Amount display (ml and oz)
- Duration display
- Feeding method display
- Delete button functionality
- Timestamp formatting

## Test Utilities

### Helper Functions (`helpers.ts`)

- `waitForComponent(tagName)` - Wait for a web component to be defined
- `waitForElement(selector, parent, timeout)` - Wait for an element to appear
- `waitFor(condition, timeout, message)` - Wait for a condition to be true
- `mountComponent(tagName, attributes)` - Create and mount a component for testing
- `cleanup()` - Clean up the DOM after tests
- `getShadowRoot(element)` - Get shadow root from an element
- `queryShadow(element, selector)` - Query selector in shadow root
- `queryShadowAll(element, selector)` - Query all selectors in shadow root
- `triggerEvent(element, eventName, detail)` - Trigger a custom event

### Setup (`setup.ts`)

The setup file includes:
- URLPattern polyfill for browser routing tests
- File System Access API mocks for storage tests
- crypto.randomUUID mock for consistent test IDs

## Technology Stack

- **Vitest** - Fast, modern testing framework
- **happy-dom** - Lightweight DOM implementation for testing
- **urlpattern-polyfill** - URLPattern API support for tests
- **@vitest/ui** - Visual UI for test results

## Writing New Tests

When writing new tests, follow these patterns:

```typescript
import { describe, it, expect, afterEach } from 'vitest';
import { cleanup, mountComponent, queryShadow } from './helpers.js';
import type { YourComponent } from '../src/components/your-component.js';

describe('YourComponent', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render correctly', async () => {
    const component = await mountComponent<YourComponent>('your-component');
    
    const element = queryShadow(component, '.some-class');
    expect(element).toBeTruthy();
  });
});
```

## Key Features

- **Shadow DOM Testing** - Helper functions to easily test web components with shadow DOM
- **Async/Await Support** - All tests use modern async/await patterns
- **Comprehensive Coverage** - Tests cover routing, component rendering, user interactions, and event handling
- **Fast Execution** - Tests run quickly with happy-dom
- **Mocked APIs** - File System Access API and other browser APIs are properly mocked
