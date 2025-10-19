/**
 * Material 3 Theme Generator
 * Generates a complete Material 3 color scheme from a primary color
 */

export interface ThemeColors {
  light: {
    primary: string;
    onPrimary: string;
    primaryContainer: string;
    onPrimaryContainer: string;
    secondary: string;
    onSecondary: string;
    secondaryContainer: string;
    onSecondaryContainer: string;
    tertiary: string;
    onTertiary: string;
    tertiaryContainer: string;
    onTertiaryContainer: string;
    error: string;
    onError: string;
    errorContainer: string;
    onErrorContainer: string;
    background: string;
    onBackground: string;
    surface: string;
    onSurface: string;
    surfaceVariant: string;
    onSurfaceVariant: string;
    surfaceContainerLowest: string;
    surfaceContainerLow: string;
    surfaceContainer: string;
    surfaceContainerHigh: string;
    surfaceContainerHighest: string;
    outline: string;
    outlineVariant: string;
    shadow: string;
    scrim: string;
  };
  dark: {
    primary: string;
    onPrimary: string;
    primaryContainer: string;
    onPrimaryContainer: string;
    secondary: string;
    onSecondary: string;
    secondaryContainer: string;
    onSecondaryContainer: string;
    tertiary: string;
    onTertiary: string;
    tertiaryContainer: string;
    onTertiaryContainer: string;
    error: string;
    onError: string;
    errorContainer: string;
    onErrorContainer: string;
    background: string;
    onBackground: string;
    surface: string;
    onSurface: string;
    surfaceVariant: string;
    onSurfaceVariant: string;
    surfaceContainerLowest: string;
    surfaceContainerLow: string;
    surfaceContainer: string;
    surfaceContainerHigh: string;
    surfaceContainerHighest: string;
    outline: string;
    outlineVariant: string;
    shadow: string;
    scrim: string;
  };
}

interface HSL {
  h: number;
  s: number;
  l: number;
}

// Convert hex to HSL
function hexToHSL(hex: string): HSL {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

// Convert HSL to hex
function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (h >= 300 && h < 360) {
    r = c;
    g = 0;
    b = x;
  }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Generate a variant of a color
function generateVariant(baseHSL: HSL, hueDelta: number, satDelta: number, lightDelta: number): string {
  const h = (baseHSL.h + hueDelta + 360) % 360;
  const s = Math.max(0, Math.min(100, baseHSL.s + satDelta));
  const l = Math.max(0, Math.min(100, baseHSL.l + lightDelta));
  return hslToHex(h, s, l);
}

export function generateThemeFromColor(primaryHex: string): ThemeColors {
  // Ensure hex format
  const normalizedHex = primaryHex.startsWith('#') ? primaryHex : `#${primaryHex}`;
  const baseHSL = hexToHSL(normalizedHex);

  // Light theme
  const light = {
    primary: normalizedHex,
    onPrimary: '#ffffff',
    primaryContainer: generateVariant(baseHSL, 0, -20, 35),
    onPrimaryContainer: generateVariant(baseHSL, 0, 0, -30),

    secondary: generateVariant(baseHSL, 25, -30, -10),
    onSecondary: '#ffffff',
    secondaryContainer: generateVariant(baseHSL, 25, -35, 35),
    onSecondaryContainer: generateVariant(baseHSL, 25, -20, -30),

    tertiary: generateVariant(baseHSL, -35, -15, -5),
    onTertiary: '#ffffff',
    tertiaryContainer: generateVariant(baseHSL, -35, -20, 40),
    onTertiaryContainer: generateVariant(baseHSL, -35, -10, -30),

    error: '#ba1a1a',
    onError: '#ffffff',
    errorContainer: '#ffdad6',
    onErrorContainer: '#410002',

    background: '#f8fbff',
    onBackground: '#1a1c1e',

    surface: '#f8fbff',
    onSurface: '#1a1c1e',
    surfaceVariant: '#dfe2eb',
    onSurfaceVariant: '#43474e',

    surfaceContainerLowest: '#ffffff',
    surfaceContainerLow: '#f2f5f9',
    surfaceContainer: '#eceff3',
    surfaceContainerHigh: '#e6e9ee',
    surfaceContainerHighest: '#e0e3e8',

    outline: '#73777f',
    outlineVariant: '#c3c6cf',

    shadow: '#000000',
    scrim: '#000000',
  };

  // Dark theme - lighter variants of primary
  const dark = {
    primary: generateVariant(baseHSL, 0, -10, 30),
    onPrimary: generateVariant(baseHSL, 0, 10, -25),
    primaryContainer: generateVariant(baseHSL, 0, 0, -15),
    onPrimaryContainer: generateVariant(baseHSL, 0, -20, 35),

    secondary: generateVariant(baseHSL, 25, -35, 25),
    onSecondary: generateVariant(baseHSL, 25, -15, -25),
    secondaryContainer: generateVariant(baseHSL, 25, -25, -20),
    onSecondaryContainer: generateVariant(baseHSL, 25, -35, 35),

    tertiary: generateVariant(baseHSL, -35, -25, 30),
    onTertiary: generateVariant(baseHSL, -35, -10, -25),
    tertiaryContainer: generateVariant(baseHSL, -35, -15, -15),
    onTertiaryContainer: generateVariant(baseHSL, -35, -20, 40),

    error: '#ffb4ab',
    onError: '#690005',
    errorContainer: '#93000a',
    onErrorContainer: '#ffdad6',

    background: '#1a1c1e',
    onBackground: '#e2e2e5',

    surface: '#1a1c1e',
    onSurface: '#e2e2e5',
    surfaceVariant: '#43474e',
    onSurfaceVariant: '#c3c6cf',

    surfaceContainerLowest: '#0f1113',
    surfaceContainerLow: '#1a1c1e',
    surfaceContainer: '#1e2022',
    surfaceContainerHigh: '#282a2d',
    surfaceContainerHighest: '#333538',

    outline: '#8d9199',
    outlineVariant: '#43474e',

    shadow: '#000000',
    scrim: '#000000',
  };

  return { light, dark };
}

export function applyThemeToDocument(colors: ThemeColors): void {
  const root = document.documentElement;

  // Apply light theme variables
  Object.entries(colors.light).forEach(([key, value]) => {
    const cssVar = `--md-sys-color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    root.style.setProperty(cssVar, value);
  });

  // For dark mode, we need to set up the media query
  // This is handled by the inline script in index.html
}

export const PRESET_COLORS = [
  { name: 'Blue', value: '#0061a6' },
  { name: 'Purple', value: '#6750a4' },
  { name: 'Green', value: '#006e1c' },
  { name: 'Orange', value: '#c2410c' },
  { name: 'Pink', value: '#d946ef' },
  { name: 'Teal', value: '#0891b2' },
  { name: 'Red', value: '#dc2626' },
  { name: 'Indigo', value: '#4f46e5' },
];
