import { expect } from 'vitest';

/**
 * Helper to wait for a web component to be defined
 */
export async function waitForComponent(tagName: string): Promise<void> {
  if (!customElements.get(tagName)) {
    await customElements.whenDefined(tagName);
  }
}

/**
 * Helper to wait for an element to appear in the DOM
 */
export async function waitForElement(
  selector: string,
  parent: Element | Document = document,
  timeout = 3000
): Promise<Element> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const element = parent.querySelector(selector);
    if (element) {
      return element;
    }
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  throw new Error(`Element with selector "${selector}" not found within ${timeout}ms`);
}

/**
 * Helper to wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean,
  timeout = 3000,
  message = 'Condition not met within timeout'
): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  throw new Error(message);
}

/**
 * Helper to create and mount a component for testing
 */
export async function mountComponent<T extends HTMLElement>(
  tagName: string,
  attributes: Record<string, string> = {}
): Promise<T> {
  await waitForComponent(tagName);
  
  const element = document.createElement(tagName) as T;
  
  // Set attributes
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  
  document.body.appendChild(element);
  
  // Wait for component to render
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return element;
}

/**
 * Helper to clean up the DOM after tests
 */
export function cleanup(): void {
  document.body.innerHTML = '';
}

/**
 * Helper to get shadow root content
 */
export function getShadowRoot(element: HTMLElement): ShadowRoot {
  const shadowRoot = element.shadowRoot;
  expect(shadowRoot).toBeTruthy();
  return shadowRoot!;
}

/**
 * Helper to query selector in shadow root
 */
export function queryShadow<T extends Element>(
  element: HTMLElement,
  selector: string
): T | null {
  const shadowRoot = getShadowRoot(element);
  return shadowRoot.querySelector<T>(selector);
}

/**
 * Helper to query all selectors in shadow root
 */
export function queryShadowAll<T extends Element>(
  element: HTMLElement,
  selector: string
): NodeListOf<T> {
  const shadowRoot = getShadowRoot(element);
  return shadowRoot.querySelectorAll<T>(selector);
}

/**
 * Trigger a custom event on an element
 */
export function triggerEvent(
  element: Element,
  eventName: string,
  detail?: any
): void {
  const event = new CustomEvent(eventName, {
    detail,
    bubbles: true,
    composed: true,
  });
  element.dispatchEvent(event);
}
