import { useState } from 'react';
import { Check } from 'lucide-react';
import type { ActiveGame } from '../game';
import { useI18n } from '../i18n';

interface Props {
  game: ActiveGame;
  onDone: () => void;
}

/**
 * Pass-the-phone reveal, in no particular order: the screen lists every
 * player; whoever holds the phone taps their own name to open a card, flips
 * it to see their role (the companion's secret word or the impostor's hint),
 * hides it, and passes the phone on. Once everyone has looked, the discussion
 * can start.
 */
export function RevealScreen({ game, onDone }: Props) {
  const { m } = useI18n();
  const [revealed, setRevealed] = useState<boolean[]>(() => game.players.map(() => false));
  const [current, setCurrent] = useState<number | null>(null);
  const [flipped, setFlipped] = useState(false);

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
                {revealed[i] && <Check size={20} aria-hidden="true" />}
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

  // The game starts before the server answers with the word, so the back of
  // the card may not have content yet; it falls back to a loading line until
  // the round arrives.
  const round = game.round;
  const isImpostor = game.impostor[current];

  const close = () => {
    setRevealed((prev) => prev.map((r, i) => (i === current ? true : r)));
    setCurrent(null);
    setFlipped(false);
  };

  return (
    <div className="flip-card-screen">
      <div className={`flip-card ${flipped ? 'flipped' : ''}`}>
        <div className="flip-inner">
          {/* Front: who holds the phone, before flipping. */}
          <button
            type="button"
            className="flip-face flip-front"
            aria-hidden={flipped}
            onClick={() => setFlipped(true)}
          >
            <span className="flip-name">{game.players[current]}</span>
            <span className="muted small">{m.privacyNote}</span>
            <span className="flip-hint">{m.tapToFlip}</span>
          </button>

          {/* Back: the secret role, only meaningful once flipped. */}
          <div className={`flip-face flip-back ${isImpostor ? 'impostor' : ''}`} aria-hidden={!flipped}>
            {!round ? (
              <p className="muted pulse">{m.pickingWord}</p>
            ) : (
              <>
                <h1 className="role-title">{isImpostor ? m.roleImpostor : m.roleCompanion}</h1>
                {(!isImpostor || game.showCategory) && (
                  <p className="muted">{m.categoryLabel(round.category)}</p>
                )}
                {isImpostor ? (
                  game.showHint && <p className="muted">{m.hintLabel(round.hint)}</p>
                ) : (
                  <>
                    <p className="muted">{m.secretWordIs}</p>
                    <p className="secret">{round.word}</p>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {flipped && (
        <button className="button primary big" disabled={!round} onClick={close}>
          {m.hide}
        </button>
      )}
    </div>
  );
}
