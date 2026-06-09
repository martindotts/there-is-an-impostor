// Central place for locale support. To add a language: add it here, add a
// messages dictionary in src/client/i18n.tsx, and seed `*_translations` rows.

export const SUPPORTED_LOCALES = ['en', 'es'] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

const DEFAULT_PLAYER_WORD: Record<Locale, string> = {
  en: 'Player',
  es: 'Jugador',
};

/** Default roster names ("Player 1" / "Jugador 1") seeded on first use. */
export function defaultPlayerName(locale: Locale, n: number): string {
  return `${DEFAULT_PLAYER_WORD[locale]} ${n}`;
}
