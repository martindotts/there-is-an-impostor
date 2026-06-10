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
  continueWithGoogle: string;
  continueWithApple: string;
  devLogin: string;
  noProviders: string;
  loading: string;
  signOut: string;
  language: string;
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
  tapToReveal: string;
  hide: string;
  startDiscussion: string;
  categoryLabel: (name: string) => string;
  youAreImpostor: string;
  yourHint: string;
  blendIn: string;
  secretWordIs: string;
  describeCarefully: string;
  discussionTime: string;
  discussionRules: (impostorCount: number) => string;
  impostorsHiding: (n: number) => string;
  revealImpostors: string;
  theReveal: string;
  secretWordWas: string;
  hintWas: (hint: string) => string;
  playAgain: string;
  changeSetup: string;
}

const en: Messages = {
  tagline: 'Everyone gets the secret word — except the impostors. Find them before they blend in.',
  continueWithGoogle: 'Continue with Google',
  continueWithApple: 'Continue with Apple',
  devLogin: '🛠️ Dev login (local only)',
  noProviders: 'No login providers are configured yet. See the README for setup instructions.',
  loading: 'Loading…',
  signOut: 'Sign out',
  language: 'Language',
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
  tapToReveal: 'Tap to reveal',
  hide: 'Hide',
  startDiscussion: 'Start discussion',
  categoryLabel: (name) => `Category: ${name}`,
  youAreImpostor: '🕵️ You are an impostor',
  yourHint: 'Your hint:',
  blendIn: "Blend in. Don't let them figure out you don't know the word.",
  secretWordIs: 'The secret word is:',
  describeCarefully: 'Describe it without giving it away — impostors are listening.',
  discussionTime: 'Discussion time',
  discussionRules: (impostorCount) =>
    `starts. Going around, everyone says one word or phrase about the secret word. Then vote on who the ${
      impostorCount > 1 ? 'impostors are' : 'impostor is'
    }.`,
  impostorsHiding: (n) =>
    n === 1 ? '1 impostor is hiding among you.' : `${n} impostors are hiding among you.`,
  revealImpostors: 'Reveal the impostors',
  theReveal: 'The reveal',
  secretWordWas: 'The secret word was:',
  hintWas: (hint) => `The impostor hint was “${hint}”.`,
  playAgain: 'Play again',
  changeSetup: 'Change setup',
};

const es: Messages = {
  tagline: 'Todos reciben la palabra secreta, excepto los impostores. Encuéntralos antes de que se mimeticen.',
  continueWithGoogle: 'Continuar con Google',
  continueWithApple: 'Continuar con Apple',
  devLogin: '🛠️ Acceso dev (solo local)',
  noProviders: 'Todavía no hay proveedores de inicio de sesión configurados. Consulta el README.',
  loading: 'Cargando…',
  signOut: 'Cerrar sesión',
  language: 'Idioma',
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
  tapToReveal: 'Toca para revelar',
  hide: 'Ocultar',
  startDiscussion: 'Comenzar el debate',
  categoryLabel: (name) => `Categoría: ${name}`,
  youAreImpostor: '🕵️ Eres un impostor',
  yourHint: 'Tu pista:',
  blendIn: 'Mimetízate. Que no descubran que no conoces la palabra.',
  secretWordIs: 'La palabra secreta es:',
  describeCarefully: 'Descríbela sin delatarla: los impostores están escuchando.',
  discussionTime: 'Hora del debate',
  discussionRules: (impostorCount) =>
    `comienza. Por turnos, cada uno dice una palabra o frase sobre la palabra secreta. Luego voten ${
      impostorCount > 1 ? 'quiénes son los impostores' : 'quién es el impostor'
    }.`,
  impostorsHiding: (n) =>
    n === 1
      ? 'Hay 1 impostor escondido entre ustedes.'
      : `Hay ${n} impostores escondidos entre ustedes.`,
  revealImpostors: 'Revelar a los impostores',
  theReveal: 'La revelación',
  secretWordWas: 'La palabra secreta era:',
  hintWas: (hint) => `La pista del impostor era «${hint}».`,
  playAgain: 'Jugar de nuevo',
  changeSetup: 'Cambiar configuración',
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
