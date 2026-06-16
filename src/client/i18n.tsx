import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, isLocale } from '../shared/i18n';
import type { Locale } from '../shared/i18n';

const STORAGE_KEY = 'locale';

/**
 * Every UI string lives here. Dynamic strings are functions so each language
 * controls its own word order and pluralization.
 */
export interface Messages {
  tagline: string;
  featureEndlessTitle: string;
  featureEndlessText: string;
  featureNoRepeatTitle: string;
  featureNoRepeatText: string;
  continueWithGoogle: string;
  continueWithApple: string;
  devLogin: string;
  noProviders: string;
  loading: string;
  signOut: string;
  language: string;
  settings: string;
  showHintSetting: string;
  showCategorySetting: string;
  close: string;
  newGame: string;
  next: string;
  back: string;
  stepOf: (step: number, total: number) => string;
  playersAndImpostors: string;
  categories: string;
  selectAll: string;
  clearAll: string;
  selectAtLeastOne: string;
  impostors: string;
  playersWithCount: (n: number) => string;
  impostorsLabel: (n: number) => string;
  impostorsCap: (cap: number, players: number) => string;
  playerNamePlaceholder: string;
  addPlayer: string;
  removePlayer: (name: string) => string;
  needMorePlayers: (min: number) => string;
  maxPlayersReached: (max: number) => string;
  startGame: string;
  pickingWord: string;
  poolReset: string;
  decrease: string;
  increase: string;
  whoHasPhone: string;
  passPhoneHint: string;
  privacyNote: string;
  tapToFlip: string;
  hide: string;
  startDiscussion: string;
  categoryLabel: (name: string) => string;
  hintLabel: (hint: string) => string;
  roleCompanion: string;
  roleImpostor: string;
  secretWordIs: string;
  discussionTime: string;
  startsLabel: string;
  discussionRules: string;
  startVoting: string;
  whoToEject: string;
  wasImpostor: string;
  wasNotImpostor: string;
  continueGame: string;
  seeResult: string;
  companionsWin: string;
  impostorsWin: string;
  impostorsWereLabel: (count: number) => string;
  secretWordWas: string;
  hintWasLabel: string;
  playAgain: string;
  exit: string;
}

const en: Messages = {
  tagline: 'Everyone gets the secret word — except the impostors. Find them before they blend in.',
  featureEndlessTitle: 'Endless words',
  featureEndlessText: 'the deck grows itself with AI',
  featureNoRepeatTitle: 'Never repeated',
  featureNoRepeatText: "you won't see the same word twice",
  continueWithGoogle: 'Continue with Google',
  continueWithApple: 'Continue with Apple',
  devLogin: 'Dev login (local only)',
  noProviders: 'No login providers are configured yet. See the README for setup instructions.',
  loading: 'Loading…',
  signOut: 'Sign out',
  language: 'Language',
  settings: 'Settings',
  showHintSetting: 'Show hint to impostors',
  showCategorySetting: 'Show category to impostors',
  close: 'Close',
  newGame: 'New game',
  next: 'Next',
  back: 'Back',
  stepOf: (step, total) => `Step ${step} of ${total}`,
  playersAndImpostors: 'Players & impostors',
  categories: 'Categories',
  selectAll: 'Select all',
  clearAll: 'Clear all',
  selectAtLeastOne: 'Select at least one category.',
  impostors: 'Impostors',
  playersWithCount: (n) => `Players (${n})`,
  impostorsLabel: (n) => (n === 1 ? '1 impostor' : `${n} impostors`),
  impostorsCap: (cap, players) => `Up to ${cap} for ${players} players.`,
  playerNamePlaceholder: 'Player name',
  addPlayer: 'Add',
  removePlayer: (name) => `Remove ${name}`,
  needMorePlayers: (min) => `You need at least ${min} players.`,
  maxPlayersReached: (max) => `Maximum ${max} players.`,
  startGame: 'Start game',
  pickingWord: 'Picking a word…',
  poolReset: "You've seen every word in these categories, so the deck was reshuffled — words may repeat from now on.",
  decrease: 'decrease',
  increase: 'increase',
  whoHasPhone: 'Who has the phone?',
  passPhoneHint: 'Pass the phone around. Each player taps their own name to see their word.',
  privacyNote: 'Make sure nobody else can see the screen.',
  tapToFlip: 'Tap to flip',
  hide: 'Hide',
  startDiscussion: 'Start discussion',
  categoryLabel: (name) => `Category: ${name}`,
  hintLabel: (hint) => `Hint: ${hint}`,
  roleCompanion: 'Companion',
  roleImpostor: 'Impostor',
  secretWordIs: 'The secret word is:',
  discussionTime: 'Discussion time',
  startsLabel: 'Starts:',
  discussionRules:
    'Taking turns, everyone says one word or phrase about the secret word. Then decide who to vote out.',
  startVoting: 'Start voting',
  whoToEject: 'Who gets voted out?',
  wasImpostor: 'Was an impostor',
  wasNotImpostor: 'Was not an impostor',
  continueGame: 'Continue',
  seeResult: 'See the result',
  companionsWin: 'Companions win!',
  impostorsWin: 'Impostors win!',
  impostorsWereLabel: (count) => (count === 1 ? 'The impostor was:' : 'The impostors were:'),
  secretWordWas: 'The secret word was:',
  hintWasLabel: 'The impostor hint was:',
  playAgain: 'Play again',
  exit: 'Exit',
};

const es: Messages = {
  tagline: 'Todos reciben la palabra secreta, excepto los impostores. Encuéntralos antes de que se mimeticen.',
  featureEndlessTitle: 'Palabras infinitas',
  featureEndlessText: 'el mazo crece solo con IA',
  featureNoRepeatTitle: 'Nunca repetidas',
  featureNoRepeatText: 'no volverás a ver la misma palabra',
  continueWithGoogle: 'Continuar con Google',
  continueWithApple: 'Continuar con Apple',
  devLogin: 'Acceso dev (solo local)',
  noProviders: 'Todavía no hay proveedores de inicio de sesión configurados. Consulta el README.',
  loading: 'Cargando…',
  signOut: 'Cerrar sesión',
  language: 'Idioma',
  settings: 'Configuración',
  showHintSetting: 'Mostrar pista al impostor',
  showCategorySetting: 'Mostrar categoría al impostor',
  close: 'Cerrar',
  newGame: 'Nuevo juego',
  next: 'Siguiente',
  back: 'Atrás',
  stepOf: (step, total) => `Paso ${step} de ${total}`,
  playersAndImpostors: 'Jugadores e impostores',
  categories: 'Categorías',
  selectAll: 'Seleccionar todas',
  clearAll: 'Quitar todas',
  selectAtLeastOne: 'Selecciona al menos una categoría.',
  impostors: 'Impostores',
  playersWithCount: (n) => `Jugadores (${n})`,
  impostorsLabel: (n) => (n === 1 ? '1 impostor' : `${n} impostores`),
  impostorsCap: (cap, players) => `Hasta ${cap} para ${players} jugadores.`,
  playerNamePlaceholder: 'Nombre del jugador',
  addPlayer: 'Agregar',
  removePlayer: (name) => `Quitar a ${name}`,
  needMorePlayers: (min) => `Necesitas al menos ${min} jugadores.`,
  maxPlayersReached: (max) => `Máximo ${max} jugadores.`,
  startGame: 'Comenzar partida',
  pickingWord: 'Eligiendo una palabra…',
  poolReset: 'Ya viste todas las palabras de estas categorías, así que el mazo se reinició: a partir de ahora pueden repetirse.',
  decrease: 'disminuir',
  increase: 'aumentar',
  whoHasPhone: '¿Quién tiene el teléfono?',
  passPhoneHint: 'Vayan pasando el teléfono. Cada jugador toca su nombre para ver su palabra.',
  privacyNote: 'Asegúrate de que nadie más vea la pantalla.',
  tapToFlip: 'Toca para dar la vuelta',
  hide: 'Ocultar',
  startDiscussion: 'Comenzar el debate',
  categoryLabel: (name) => `Categoría: ${name}`,
  hintLabel: (hint) => `Pista: ${hint}`,
  roleCompanion: 'Compañero',
  roleImpostor: 'Impostor',
  secretWordIs: 'La palabra secreta es:',
  discussionTime: 'Hora del debate',
  startsLabel: 'Comienza:',
  discussionRules:
    'Por turnos, cada uno dice una palabra o frase sobre la palabra secreta. Luego, decidan a quién expulsar.',
  startVoting: 'Comenzar la votación',
  whoToEject: '¿A quién expulsan?',
  wasImpostor: 'Era un impostor',
  wasNotImpostor: 'No era un impostor',
  continueGame: 'Continuar',
  seeResult: 'Ver el resultado',
  companionsWin: '¡Ganan los compañeros!',
  impostorsWin: '¡Ganan los impostores!',
  impostorsWereLabel: (count) => (count === 1 ? 'El impostor era:' : 'Los impostores eran:'),
  secretWordWas: 'La palabra secreta era:',
  hintWasLabel: 'La pista del impostor fue:',
  playAgain: 'Jugar de nuevo',
  exit: 'Salir',
};

export const messages: Record<Locale, Messages> = { en, es };

function detectLocale(): Locale {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (isLocale(saved)) return saved;
  const nav = navigator.language?.slice(0, 2);
  return isLocale(nav) ? nav : DEFAULT_LOCALE;
}

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  m: Messages;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = (next: Locale) => {
    localStorage.setItem(STORAGE_KEY, next);
    setLocaleState(next);
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, m: messages[locale] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}

export function LocaleSwitcher() {
  const { locale, setLocale } = useI18n();
  return (
    <div className="locale-switcher" role="group" aria-label="Language">
      {SUPPORTED_LOCALES.map((l) => (
        <button
          key={l}
          className={l === locale ? 'active' : ''}
          onClick={() => setLocale(l)}
          aria-pressed={l === locale}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
