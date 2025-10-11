import { describe, it, expect } from 'vitest';
import { SettingsPage } from '../src/pages/about-page.js';

describe('AboutPage export compatibility', () => {
  it('should re-export the settings page class', () => {
    expect(SettingsPage.name).toBe('SettingsPage');
  });
});
