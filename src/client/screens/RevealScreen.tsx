import { useState } from 'react';
import type { ActiveGame } from '../game';
import { useI18n } from '../i18n';

interface Props {
  game: ActiveGame;
  onDone: () => void;
}

/**
 * Pass-the-phone reveal, in no particular order: the screen lists every
 * player; whoever holds the phone taps their own name, sees their word (or
 * the impostor hint), hides it, and passes the phone on. Once everyone has
 * looked, the discussion can start.
 */
export function RevealScreen({ game, onDone }: Props) {
  const { m } = useI18n();
  const [revealed, setRevealed] = useState<boolean[]>(() => game.players.map(() => false));
  const [current, setCurrent] = useState<number | null>(null);
  const [shown, setShown] = useState(false);

  const allRevealed = revealed.every(Boolean);

  // Name list: whoever holds the phone picks themselves.
  if (current === null) {
    return (
      <div className="reveal-list">
        <h1>{m.whoHasPhone}</h1>
        <p className="muted">{m.passPhoneHint}</p>
        <ul className="name-list">
          {game.players.map((name, i) => (
            <li key={i}>
              <button
                className={`button name-button ${revealed[i] ? 'seen' : ''}`}
                disabled={revealed[i]}
                onClick={() => setCurrent(i)}
              >
                <span className="roster-name">{name}</span>
                {revealed[i] && <span aria-hidden="true">✓</span>}
              </button>
            </li>
          ))}
        </ul>
        <button className="button primary big" disabled={!allRevealed} onClick={onDone}>
          {m.startDiscussion}
        </button>
      </div>
    );
  }

  // Privacy gate before showing anything.
  if (!shown) {
    return (
      <div className="centered reveal">
        <h1>{game.players[current]}</h1>
        <p className="muted">{m.privacyNote}</p>
        <button className="button primary big" onClick={() => setShown(true)}>
          {m.tapToReveal}
        </button>
      </div>
    );
  }

  // The game starts before the server answers with the word; in the rare case
  // a player gets here first, show a brief loading card until it arrives.
  if (!game.round) {
    return (
      <div className="centered reveal">
        <h1>{game.players[current]}</h1>
        <p className="muted pulse">{m.pickingWord}</p>
      </div>
    );
  }

  const isImpostor = game.impostor[current];
  return (
    <div className={`centered reveal ${isImpostor ? 'impostor' : ''}`}>
      {(!isImpostor || game.showCategory) && (
        <p className="muted">{m.categoryLabel(game.round.category)}</p>
      )}
      {isImpostor ? (
        <>
          <div className="role-badge">{m.youAreImpostor}</div>
          {game.showHint && (
            <>
              <p className="muted">{m.yourHint}</p>
              <h1 className="secret">“{game.round.hint}”</h1>
            </>
          )}
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
          setRevealed((prev) => prev.map((r, i) => (i === current ? true : r)));
          setCurrent(null);
          setShown(false);
        }}
      >
        {m.hide}
      </button>
    </div>
  );
}
