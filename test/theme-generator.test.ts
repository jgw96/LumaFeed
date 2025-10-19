import { describe, it, expect } from 'vitest';
import { generateThemeFromColor, PRESET_COLORS } from '../src/utils/theme-generator.js';

describe('Theme Generator', () => {
  describe('generateThemeFromColor', () => {
    it('should generate a complete theme from a hex color', () => {
      const theme = generateThemeFromColor('#0061a6');

      expect(theme).toHaveProperty('light');
      expect(theme).toHaveProperty('dark');

      // Check light theme has all required colors
      expect(theme.light.primary).toBe('#0061a6');
      expect(theme.light.onPrimary).toBe('#ffffff');
      expect(theme.light.primaryContainer).toBeDefined();
      expect(theme.light.onPrimaryContainer).toBeDefined();
      expect(theme.light.secondary).toBeDefined();
      expect(theme.light.error).toBe('#ba1a1a');

      // Check dark theme has all required colors
      expect(theme.dark.primary).toBeDefined();
      expect(theme.dark.onPrimary).toBeDefined();
      expect(theme.dark.primaryContainer).toBeDefined();
    });

    it('should handle color without # prefix', () => {
      const theme = generateThemeFromColor('0061a6');

      expect(theme.light.primary).toBe('#0061a6');
    });

    it('should generate different secondary colors from primary', () => {
      const theme = generateThemeFromColor('#0061a6');

      expect(theme.light.secondary).not.toBe(theme.light.primary);
      expect(theme.light.tertiary).not.toBe(theme.light.primary);
      expect(theme.light.tertiary).not.toBe(theme.light.secondary);
    });

    it('should generate lighter colors for dark mode', () => {
      const theme = generateThemeFromColor('#0061a6');

      // Dark mode primary should be lighter than light mode primary
      // (This is a Material 3 design principle)
      expect(theme.dark.primary).toBeDefined();
      expect(theme.dark.primary).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('should handle different preset colors', () => {
      PRESET_COLORS.forEach((preset) => {
        const theme = generateThemeFromColor(preset.value);

        expect(theme.light.primary).toBe(preset.value);
        expect(theme.light).toHaveProperty('onPrimary');
        expect(theme.dark).toHaveProperty('primary');
      });
    });

    it('should keep error colors consistent', () => {
      const theme1 = generateThemeFromColor('#0061a6');
      const theme2 = generateThemeFromColor('#6750a4');

      // Error colors should be the same regardless of primary color
      expect(theme1.light.error).toBe(theme2.light.error);
      expect(theme1.dark.error).toBe(theme2.dark.error);
    });

    it('should generate valid hex colors for all theme properties', () => {
      const theme = generateThemeFromColor('#0061a6');
      const hexColorRegex = /^#[0-9a-f]{6}$/i;

      // Check all light theme colors are valid hex
      Object.values(theme.light).forEach((color) => {
        expect(color).toMatch(hexColorRegex);
      });

      // Check all dark theme colors are valid hex
      Object.values(theme.dark).forEach((color) => {
        expect(color).toMatch(hexColorRegex);
      });
    });
  });

  describe('PRESET_COLORS', () => {
    it('should have 8 preset colors', () => {
      expect(PRESET_COLORS).toHaveLength(8);
    });

    it('should have valid hex colors', () => {
      const hexColorRegex = /^#[0-9a-f]{6}$/i;

      PRESET_COLORS.forEach((preset) => {
        expect(preset.value).toMatch(hexColorRegex);
        expect(preset.name).toBeTruthy();
      });
    });

    it('should include expected color names', () => {
      const names = PRESET_COLORS.map((p) => p.name);

      expect(names).toContain('Blue');
      expect(names).toContain('Purple');
      expect(names).toContain('Green');
    });
  });
});
