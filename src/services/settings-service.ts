import { DEFAULT_NEXT_FEED_INTERVAL_MINUTES } from '../types/feeding-log.js';

export interface AppSettings {
  defaultFeedIntervalMinutes: number;
}

export const MIN_FEED_INTERVAL_MINUTES = 60;
export const MAX_FEED_INTERVAL_MINUTES = 360;
export const FEED_INTERVAL_STEP_MINUTES = 15;

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
    };
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
      const interval = typeof parsed.defaultFeedIntervalMinutes === 'number'
        ? parsed.defaultFeedIntervalMinutes
        : DEFAULT_NEXT_FEED_INTERVAL_MINUTES;

      return {
        defaultFeedIntervalMinutes: clampInterval(interval),
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
          : current.defaultFeedIntervalMinutes,
      ),
    };

    this.cache = next;
    this.writeToStorage(next);
    return next;
  }

  clearCache(): void {
    this.cache = null;
  }
}

export const settingsService = new SettingsService();
