// Types shared between the Worker API and the React client.

export interface SessionUser {
  id: number;
  name: string;
  email: string | null;
  provider: string;
  picture: string | null;
}

export interface Player {
  id: number;
  name: string;
}

export const MAX_PLAYER_NAME_LENGTH = 30;

export interface Category {
  id: number;
  slug: string;
  name: string;
  emoji: string;
  wordCount: number;
}

export interface Providers {
  google: boolean;
  apple: boolean;
  dev: boolean;
}

export interface StartGameRequest {
  categoryIds: number[];
  playerCount: number;
  impostorCount: number;
  /** One of SUPPORTED_LOCALES; the server falls back to the default locale. */
  locale?: string;
}

export interface GameRound {
  word: string;
  hint: string;
  category: string;
}

export interface StartGameResponse {
  round: GameRound;
  /** True when the user had seen every word in the selected categories and
   *  their history was cleared, so words may repeat from here on. */
  poolReset: boolean;
}

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 20;

/** Impostors must be a strict minority. */
export function maxImpostors(playerCount: number): number {
  return Math.max(1, Math.ceil(playerCount / 2) - 1);
}
