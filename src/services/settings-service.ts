import { DEFAULT_NEXT_FEED_INTERVAL_MINUTES, type UnitType } from '../types/feeding-log.js';

export interface AppSettings {
  defaultFeedIntervalMinutes: number;
  enableNextFeedReminder: boolean;
  defaultFeedUnit: UnitType;
  defaultFeedType: 'formula' | 'milk';
  defaultBottleFed: boolean;
  showAiSummaryCard: boolean;
  themeColor: string;
  themePreference: ThemePreference;
}

export const MIN_FEED_INTERVAL_MINUTES = 60;
export const MAX_FEED_INTERVAL_MINUTES = 360;
export const FEED_INTERVAL_STEP_MINUTES = 15;

export const DEFAULT_ENABLE_NEXT_FEED_REMINDER = true;
export const DEFAULT_FEED_UNIT: UnitType = 'ml';
export const DEFAULT_FEED_TYPE: 'formula' | 'milk' = 'formula';
export const DEFAULT_BOTTLE_FED = true;
export const DEFAULT_SHOW_AI_SUMMARY_CARD = true;
export type ThemePreference = 'system' | 'light' | 'dark';
export const DEFAULT_THEME_COLOR = '#0061a6';
export const DEFAULT_THEME_PREFERENCE: ThemePreference = 'system';

const SETTINGS_STORAGE_KEY = 'feeding-tracker-settings';

const clampInterval = (value: number): number => {
  const clamped = Math.min(MAX_FEED_INTERVAL_MINUTES, Math.max(MIN_FEED_INTERVAL_MINUTES, value));
  return Math.round(clamped);
};

const isStorageAvailable = (): boolean => {
  try {
    return typeof window !== 'undefined' && !!window.localStorage;
  } catch (error) {
    console.warn('Local storage unavailable for settings, falling back to in-memory cache.', error);
    return false;
  }
};

class SettingsService {
  private cache: AppSettings | null = null;

  private get defaults(): AppSettings {
    return {
      defaultFeedIntervalMinutes: DEFAULT_NEXT_FEED_INTERVAL_MINUTES,
      enableNextFeedReminder: DEFAULT_ENABLE_NEXT_FEED_REMINDER,
      defaultFeedUnit: DEFAULT_FEED_UNIT,
      defaultFeedType: DEFAULT_FEED_TYPE,
      defaultBottleFed: DEFAULT_BOTTLE_FED,
      showAiSummaryCard: DEFAULT_SHOW_AI_SUMMARY_CARD,
      themeColor: DEFAULT_THEME_COLOR,
      themePreference: DEFAULT_THEME_PREFERENCE,
    };
  }

  private normalizeFeedType(value: unknown): 'formula' | 'milk' {
    return value === 'milk' ? 'milk' : DEFAULT_FEED_TYPE;
  }

  private normalizeFeedUnit(value: unknown): UnitType {
    return value === 'oz' ? 'oz' : DEFAULT_FEED_UNIT;
  }

  private normalizeBoolean(value: unknown, fallback: boolean): boolean {
    return typeof value === 'boolean' ? value : fallback;
  }

  private normalizeThemeColor(value: unknown, fallback: string): string {
    if (typeof value !== 'string') {
      return fallback;
    }

    const hex = value.trim().toLowerCase();
    return /^#[0-9a-f]{6}$/.test(hex) ? hex : fallback;
  }

  private normalizeThemePreference(value: unknown, fallback: ThemePreference): ThemePreference {
    if (value === 'light' || value === 'dark' || value === 'system') {
      return value;
    }
    return fallback;
  }

  private readFromStorage(): AppSettings {
    if (!isStorageAvailable()) {
      return this.cache ?? this.defaults;
    }

    try {
      const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!raw) {
        return this.defaults;
      }

      const parsed = JSON.parse(raw) as Partial<AppSettings>;
      const interval =
        typeof parsed.defaultFeedIntervalMinutes === 'number'
          ? parsed.defaultFeedIntervalMinutes
          : DEFAULT_NEXT_FEED_INTERVAL_MINUTES;

      return {
        defaultFeedIntervalMinutes: clampInterval(interval),
        enableNextFeedReminder: this.normalizeBoolean(
          parsed.enableNextFeedReminder,
          DEFAULT_ENABLE_NEXT_FEED_REMINDER
        ),
        defaultFeedUnit: this.normalizeFeedUnit(parsed.defaultFeedUnit),
        defaultFeedType: this.normalizeFeedType(parsed.defaultFeedType),
        defaultBottleFed: this.normalizeBoolean(parsed.defaultBottleFed, DEFAULT_BOTTLE_FED),
        showAiSummaryCard: this.normalizeBoolean(
          parsed.showAiSummaryCard,
          DEFAULT_SHOW_AI_SUMMARY_CARD
        ),
        themeColor: this.normalizeThemeColor(parsed.themeColor, DEFAULT_THEME_COLOR),
        themePreference: this.normalizeThemePreference(
          parsed.themePreference,
          DEFAULT_THEME_PREFERENCE
        ),
      } satisfies AppSettings;
    } catch (error) {
      console.error('Failed to parse settings from storage, resetting to defaults.', error);
      return this.defaults;
    }
  }

  private writeToStorage(settings: AppSettings): void {
    if (!isStorageAvailable()) {
      return;
    }

    try {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to persist settings.', error);
    }
  }

  async getSettings(): Promise<AppSettings> {
    if (this.cache) {
      return this.cache;
    }

    const settings = this.readFromStorage();
    this.cache = settings;
    return settings;
  }

  async getDefaultFeedIntervalMinutes(): Promise<number> {
    const settings = await this.getSettings();
    return settings.defaultFeedIntervalMinutes;
  }

  async updateSettings(partial: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.getSettings();
    const next: AppSettings = {
      defaultFeedIntervalMinutes: clampInterval(
        typeof partial.defaultFeedIntervalMinutes === 'number'
          ? partial.defaultFeedIntervalMinutes
          : current.defaultFeedIntervalMinutes
      ),
      enableNextFeedReminder: this.normalizeBoolean(
        partial.enableNextFeedReminder,
        current.enableNextFeedReminder
      ),
      defaultFeedUnit: this.normalizeFeedUnit(
        typeof partial.defaultFeedUnit === 'string'
          ? partial.defaultFeedUnit
          : current.defaultFeedUnit
      ),
      defaultFeedType: this.normalizeFeedType(
        typeof partial.defaultFeedType === 'string'
          ? partial.defaultFeedType
          : current.defaultFeedType
      ),
      defaultBottleFed: this.normalizeBoolean(partial.defaultBottleFed, current.defaultBottleFed),
      showAiSummaryCard: this.normalizeBoolean(
        partial.showAiSummaryCard,
        current.showAiSummaryCard
      ),
      themeColor: this.normalizeThemeColor(
        typeof partial.themeColor === 'string' ? partial.themeColor : current.themeColor,
        current.themeColor
      ),
      themePreference: this.normalizeThemePreference(
        partial.themePreference,
        current.themePreference ?? DEFAULT_THEME_PREFERENCE
      ),
    };

    this.cache = next;
    this.writeToStorage(next);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent<AppSettings>('feeding-tracker-settings-changed', {
          detail: next,
        })
      );
    }
    return next;
  }

  clearCache(): void {
    this.cache = null;
  }
}

export const settingsService = new SettingsService();
