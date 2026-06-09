import { useState } from 'react';
import type { ActiveGame } from '../game';

interface Props {
  game: ActiveGame;
  onDone: () => void;
}

/**
 * Pass-the-phone reveal: each player in turn taps to see their word (or the
 * impostor hint), hides it again, and hands the phone to the next player.
 */
export function RevealScreen({ game, onDone }: Props) {
  const [player, setPlayer] = useState(1); // 1-based
  const [shown, setShown] = useState(false);

  const total = game.impostor.length;
  const isImpostor = game.impostor[player - 1];

  if (!shown) {
    return (
      <div className="centered reveal">
        <p className="muted">
          Player {player} of {total}
        </p>
        <h1>Player {player}</h1>
        <p className="muted">Make sure nobody else can see the screen.</p>
        <button className="button primary big" onClick={() => setShown(true)}>
          Tap to reveal
        </button>
      </div>
    );
  }

  return (
    <div className={`centered reveal ${isImpostor ? 'impostor' : ''}`}>
      <p className="muted">Category: {game.round.category}</p>
      {isImpostor ? (
        <>
          <div className="role-badge">🕵️ You are an impostor</div>
          <p className="muted">Your hint:</p>
          <h1 className="secret">“{game.round.hint}”</h1>
          <p className="muted small">Blend in. Don't let them figure out you don't know the word.</p>
        </>
      ) : (
        <>
          <p className="muted">The secret word is:</p>
          <h1 className="secret">{game.round.word}</h1>
          <p className="muted small">Describe it without giving it away — impostors are listening.</p>
        </>
      )}
      <button
        className="button primary big"
        onClick={() => {
          setShown(false);
          if (player === total) onDone();
          else setPlayer(player + 1);
        }}
      >
        {player === total ? 'Hide & start discussion' : `Hide & pass to Player ${player + 1}`}
      </button>
    </div>
  );
}
