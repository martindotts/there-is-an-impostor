import type { GameRound } from '../shared/types';

export interface ActiveGame {
  round: GameRound;
  /** Player names, in roster order. */
  players: string[];
  /** impostor[i] is true when players[i] is an impostor. */
  impostor: boolean[];
  /** Index into players of who opens the discussion. */
  startingPlayer: number;
}

export function buildGame(round: GameRound, players: string[], impostorCount: number): ActiveGame {
  const indices = Array.from({ length: players.length }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const impostor = new Array<boolean>(players.length).fill(false);
  for (const idx of indices.slice(0, impostorCount)) impostor[idx] = true;
  return {
    round,
    players,
    impostor,
    startingPlayer: Math.floor(Math.random() * players.length),
  };
}
