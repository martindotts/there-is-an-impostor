import { useState } from 'react';
import type { ActiveGame } from '../game';
import { useI18n } from '../i18n';

interface Props {
  game: ActiveGame;
  onDone: () => void;
}

/**
 * Pass-the-phone reveal: each player in turn taps to see their word (or the
 * impostor hint), hides it again, and hands the phone to the next player.
 */
export function RevealScreen({ game, onDone }: Props) {
  const { m } = useI18n();
  const [player, setPlayer] = useState(1); // 1-based
  const [shown, setShown] = useState(false);

  const total = game.impostor.length;
  const isImpostor = game.impostor[player - 1];

  if (!shown) {
    return (
      <div className="centered reveal">
        <p className="muted">{m.playerOf(player, total)}</p>
        <h1>{m.playerName(player)}</h1>
        <p className="muted">{m.privacyNote}</p>
        <button className="button primary big" onClick={() => setShown(true)}>
          {m.tapToReveal}
        </button>
      </div>
    );
  }

  return (
    <div className={`centered reveal ${isImpostor ? 'impostor' : ''}`}>
      <p className="muted">{m.categoryLabel(game.round.category)}</p>
      {isImpostor ? (
        <>
          <div className="role-badge">{m.youAreImpostor}</div>
          <p className="muted">{m.yourHint}</p>
          <h1 className="secret">“{game.round.hint}”</h1>
          <p className="muted small">{m.blendIn}</p>
        </>
      ) : (
        <>
          <p className="muted">{m.secretWordIs}</p>
          <h1 className="secret">{game.round.word}</h1>
          <p className="muted small">{m.describeCarefully}</p>
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
        {player === total ? m.hideAndDiscuss : m.hideAndPass(player + 1)}
      </button>
    </div>
  );
}
