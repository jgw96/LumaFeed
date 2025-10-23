const INTRO_SEEN_STORAGE_KEY = 'feeding-tracker-intro-seen-v1';

let inMemorySeen = false;

const storageAvailable = (): boolean => {
  try {
    return typeof window !== 'undefined' && !!window.localStorage;
  } catch (error) {
    console.warn('Local storage unavailable for intro experience.', error);
    return false;
  }
};

export const hasCompletedIntroExperience = (): boolean => {
  if (inMemorySeen) {
    return true;
  }

  if (!storageAvailable()) {
    return inMemorySeen;
  }

  try {
    const value = window.localStorage.getItem(INTRO_SEEN_STORAGE_KEY);
    const seen = value === 'true';
    inMemorySeen = seen;
    return seen;
  } catch (error) {
    console.error('Failed to read intro experience flag.', error);
    return inMemorySeen;
  }
};

export const markIntroExperienceCompleted = (): void => {
  inMemorySeen = true;

  if (!storageAvailable()) {
    return;
  }

  try {
    window.localStorage.setItem(INTRO_SEEN_STORAGE_KEY, 'true');
  } catch (error) {
    console.error('Failed to persist intro experience flag.', error);
  }
};

export const resetIntroExperienceFlagForTesting = (): void => {
  inMemorySeen = false;

  if (!storageAvailable()) {
    return;
  }

  try {
    window.localStorage.removeItem(INTRO_SEEN_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to reset intro experience flag.', error);
  }
};
