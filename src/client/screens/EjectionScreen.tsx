import { useState } from 'react';
import type { ActiveGame, Winner } from '../game';
import { countRemaining, decideWinner } from '../game';
import { useI18n } from '../i18n';

interface Props {
  game: ActiveGame;
  onGameOver: (winner: Winner) => void;
}

/**
 * Among Us-style voting: the group picks one player to vote out at a time. Each
 * ejection reveals whether that player was an impostor, then the parity rule
 * (see decideWinner) decides whether the game continues or someone has won.
 */
export function EjectionScreen({ game, onGameOver }: Props) {
  const { m } = useI18n();
  const [ejected, setEjected] = useState<boolean[]>(() => game.players.map(() => false));
  const [justEjected, setJustEjected] = useState<number | null>(null);

  // Verdict card for the player who was just voted out.
  if (justEjected !== null) {
    const wasImpostor = game.impostor[justEjected];
    const { impostors, companions } = countRemaining(game, ejected);
    const winner = decideWinner(impostors, companions);
    return (
      <div className={`centered ejection ${wasImpostor ? 'impostor' : ''}`}>
        <div className="logo">{wasImpostor ? '🕵️' : '😇'}</div>
        <h1>{game.players[justEjected]}</h1>
        <p className="ejection-verdict">{wasImpostor ? m.wasImpostor : m.wasNotImpostor}</p>
        <button
          className="button primary big"
          onClick={() => (winner ? onGameOver(winner) : setJustEjected(null))}
        >
          {winner ? m.seeResult : m.continueGame}
        </button>
      </div>
    );
  }

  // Pick list: who does the group vote out next?
  return (
    <div className="reveal-list">
      <h1>{m.whoToEject}</h1>
      <ul className="name-list">
        {game.players.map((name, i) =>
          ejected[i] ? null : (
            <li key={i}>
              <button
                className="button name-button"
                onClick={() => {
                  setEjected((prev) => prev.map((e, j) => (j === i ? true : e)));
                  setJustEjected(i);
                }}
              >
                <span className="roster-name">{name}</span>
              </button>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}
