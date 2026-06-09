import type { GameRound } from '../shared/types';

export interface ActiveGame {
  /** Null while the round is still being fetched (optimistic navigation). */
  round: GameRound | null;
  /** Player names, in roster order. */
  players: string[];
  /** impostor[i] is true when players[i] is an impostor. */
  impostor: boolean[];
  /** Index into players of who opens the discussion. */
  startingPlayer: number;
}

/** Roles are assigned client-side, so the game can start before the server
 *  responds with the word; the round is attached when it arrives. */
export function buildGame(players: string[], impostorCount: number): ActiveGame {
  const indices = Array.from({ length: players.length }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const impostor = new Array<boolean>(players.length).fill(false);
  for (const idx of indices.slice(0, impostorCount)) impostor[idx] = true;
  return {
    round: null,
    players,
    impostor,
    startingPlayer: Math.floor(Math.random() * players.length),
  };
}
