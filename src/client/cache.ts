// Tiny localStorage cache for stale-while-revalidate rendering: screens paint
// instantly from the last known data while fresh data loads in the background.

const PREFIX = 'imposter:cache:';

export function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeCache(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // storage full or unavailable — caching is best-effort
  }
}

export function clearCache(): void {
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(PREFIX)) localStorage.removeItem(key);
    }
  } catch {
    // ignore
  }
}

// Device preferences (like the locale) live under their own prefix so
// clearCache() on sign-out does not wipe them.

const PREF_PREFIX = 'imposter:pref:';

export function readPref<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREF_PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writePref(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREF_PREFIX + key, JSON.stringify(value));
  } catch {
    // best-effort
  }
}
