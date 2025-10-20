import {
  DEFAULT_THEME_COLOR,
  settingsService,
  type AppSettings,
  type ThemePreference,
} from '../../services/settings-service.js';

type Rgb = { r: number; g: number; b: number };

const WHITE: Rgb = { r: 255, g: 255, b: 255 };
const BLACK: Rgb = { r: 0, g: 0, b: 0 };
const NEUTRAL: Rgb = { r: 120, g: 120, b: 120 };

const prefersDark =
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null;

let currentColor = DEFAULT_THEME_COLOR;
let currentPreference: ThemePreference = 'system';

const sanitizeHex = (value: string): string => {
  const hex = value.trim().toLowerCase();
  return /^#[0-9a-f]{6}$/.test(hex) ? hex : DEFAULT_THEME_COLOR;
};

const hexToRgb = (hex: string): Rgb => {
  const normalized = hex.replace('#', '');
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return { r, g, b };
};

const rgbToHex = ({ r, g, b }: Rgb): string => {
  const toHex = (component: number) => component.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

const linearizeChannel = (value: number): number => {
  const channel = value / 255;
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
};

const relativeLuminance = ({ r, g, b }: Rgb): number => {
  const rl = linearizeChannel(r);
  const gl = linearizeChannel(g);
  const bl = linearizeChannel(b);
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
};

const contrastRatio = (foreground: Rgb, background: Rgb): number => {
  const l1 = relativeLuminance(foreground);
  const l2 = relativeLuminance(background);
  const [light, dark] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (light + 0.05) / (dark + 0.05);
};

const mixColors = (base: Rgb, blend: Rgb, weight: number): Rgb => {
  const ratio = clamp01(weight);
  return {
    r: Math.round(base.r * (1 - ratio) + blend.r * ratio),
    g: Math.round(base.g * (1 - ratio) + blend.g * ratio),
    b: Math.round(base.b * (1 - ratio) + blend.b * ratio),
  };
};

const desaturate = (color: Rgb, amount: number): Rgb => mixColors(color, NEUTRAL, amount);

const withContrast = (color: Rgb): string => {
  const black = contrastRatio(color, BLACK);
  const white = contrastRatio(color, WHITE);
  return black >= white ? '#000000' : '#ffffff';
};

const lighten = (color: Rgb, amount: number): Rgb => mixColors(color, WHITE, amount);
const darken = (color: Rgb, amount: number): Rgb => mixColors(color, BLACK, amount);

const createPalette = (hexColor: string) => {
  const base = hexToRgb(hexColor);
  const toned = desaturate(base, 0.4);

  const lightPrimary = base;
  const lightPrimaryContainer = lighten(base, 0.82);
  const lightOnPrimary = withContrast(lightPrimary);
  const lightOnPrimaryContainer = rgbToHex(darken(base, 0.7));

  const lightSecondary = lighten(toned, 0.15);
  const lightSecondaryContainer = lighten(toned, 0.78);
  const lightOnSecondary = withContrast(lightSecondary);
  const lightOnSecondaryContainer = rgbToHex(darken(toned, 0.65));

  const darkPrimary = lighten(base, 0.6);
  const darkPrimaryContainer = darken(base, 0.5);
  const darkOnPrimary = withContrast(darkPrimary);
  const darkOnPrimaryContainer = rgbToHex(lighten(base, 0.8));

  const darkSecondary = darken(toned, 0.25);
  const darkSecondaryContainer = darken(toned, 0.55);
  const darkOnSecondary = withContrast(darkSecondary);
  const darkOnSecondaryContainer = rgbToHex(lighten(toned, 0.78));

  return {
    light: {
      '--md-sys-color-primary': rgbToHex(lightPrimary),
      '--md-sys-color-on-primary': lightOnPrimary,
      '--md-sys-color-primary-container': rgbToHex(lightPrimaryContainer),
      '--md-sys-color-on-primary-container': lightOnPrimaryContainer,
      '--md-sys-color-secondary': rgbToHex(lightSecondary),
      '--md-sys-color-on-secondary': lightOnSecondary,
      '--md-sys-color-secondary-container': rgbToHex(lightSecondaryContainer),
      '--md-sys-color-on-secondary-container': lightOnSecondaryContainer,
    },
    dark: {
      '--md-sys-color-primary': rgbToHex(darkPrimary),
      '--md-sys-color-on-primary': darkOnPrimary,
      '--md-sys-color-primary-container': rgbToHex(darkPrimaryContainer),
      '--md-sys-color-on-primary-container': darkOnPrimaryContainer,
      '--md-sys-color-secondary': rgbToHex(darkSecondary),
      '--md-sys-color-on-secondary': darkOnSecondary,
      '--md-sys-color-secondary-container': rgbToHex(darkSecondaryContainer),
      '--md-sys-color-on-secondary-container': darkOnSecondaryContainer,
    },
  };
};

const applyPalette = (palette: Record<string, string>): void => {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  Object.entries(palette).forEach(([token, value]) => {
    root.style.setProperty(token, value);
  });

  if (palette['--md-sys-color-primary']) {
    root.style.setProperty('accent-color', palette['--md-sys-color-primary']);
  }
};

const resolveScheme = (): 'light' | 'dark' => {
  if (currentPreference === 'system') {
    return prefersDark?.matches ? 'dark' : 'light';
  }

  return currentPreference;
};

const applyDocumentScheme = (scheme: 'light' | 'dark'): void => {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  if (currentPreference === 'system') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', scheme);
  }
  root.style.colorScheme = scheme;
};

const applyCurrentTheme = (): void => {
  const palette = createPalette(currentColor);
  const scheme = resolveScheme();
  const schemePalette = palette[scheme];
  applyPalette(schemePalette);
  applyDocumentScheme(scheme);
};

const handleSettingsChange = (event: Event): void => {
  const detail = (event as CustomEvent<AppSettings>).detail;
  if (!detail) {
    return;
  }

  const next = sanitizeHex(detail.themeColor ?? DEFAULT_THEME_COLOR);
  const nextPreference = detail.themePreference ?? 'system';

  let changed = false;

  if (next !== currentColor) {
    currentColor = next;
    changed = true;
  }

  if (nextPreference !== currentPreference) {
    currentPreference = nextPreference;
    changed = true;
  }

  if (changed) {
    applyCurrentTheme();
  }
};

export const setThemeColor = (hexColor: string): void => {
  currentColor = sanitizeHex(hexColor);
  applyCurrentTheme();
};

export const setThemePreference = (preference: ThemePreference): void => {
  currentPreference = preference;
  applyCurrentTheme();
};

export const initializeTheme = async (): Promise<void> => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const settings = await settingsService.getSettings();
    currentColor = sanitizeHex(settings.themeColor ?? DEFAULT_THEME_COLOR);
    currentPreference = settings.themePreference ?? 'system';
  } catch (error) {
    console.warn('Falling back to default theme color.', error);
    currentColor = DEFAULT_THEME_COLOR;
    currentPreference = 'system';
  }

  applyCurrentTheme();

  const mediaQuery = prefersDark as
    | (MediaQueryList & {
        addListener?: (listener: (event: MediaQueryListEvent) => void) => void;
      })
    | null;

  const handleMediaChange = () => {
    if (currentPreference === 'system') {
      applyCurrentTheme();
    }
  };

  if (mediaQuery?.addEventListener) {
    mediaQuery.addEventListener('change', handleMediaChange);
  } else if (mediaQuery?.addListener) {
    mediaQuery.addListener(handleMediaChange);
  }
  window.addEventListener('feeding-tracker-settings-changed', handleSettingsChange);
};
