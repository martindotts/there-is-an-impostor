// Types shared between the Worker API and the React client.

export interface SessionUser {
  id: number;
  name: string;
  email: string | null;
  provider: string;
}

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
}

export interface GameRound {
  word: string;
  hint: string;
  category: string;
}

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 20;

/** Impostors must be a strict minority. */
export function maxImpostors(playerCount: number): number {
  return Math.max(1, Math.ceil(playerCount / 2) - 1);
}
