import type { GameRound } from '../shared/types';

export interface ActiveGame {
  round: GameRound;
  /** impostor[i] is true when player i+1 is an impostor. */
  impostor: boolean[];
  /** 1-based player number that opens the discussion. */
  startingPlayer: number;
}

export function buildGame(round: GameRound, playerCount: number, impostorCount: number): ActiveGame {
  const indices = Array.from({ length: playerCount }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const impostor = new Array<boolean>(playerCount).fill(false);
  for (const idx of indices.slice(0, impostorCount)) impostor[idx] = true;
  return {
    round,
    impostor,
    startingPlayer: 1 + Math.floor(Math.random() * playerCount),
  };
}
