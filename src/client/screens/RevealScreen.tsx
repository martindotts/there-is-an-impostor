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
 * player; whoever holds the phone taps their own name, which pops up their
 * card. They flip it to see their role (the companion's secret word or the
 * impostor's hint), hide it, and pass the phone on. Once everyone has looked,
 * the discussion can start.
 */
export function RevealScreen({ game, onDone }: Props) {
  const { m } = useI18n();
  const [revealed, setRevealed] = useState<boolean[]>(() => game.players.map(() => false));
  const [current, setCurrent] = useState<number | null>(null);
  const [flipped, setFlipped] = useState(false);

  const allRevealed = revealed.every(Boolean);

  const close = () => {
    setRevealed((prev) => prev.map((r, i) => (i === current ? true : r)));
    setCurrent(null);
    setFlipped(false);
  };

  // The game starts before the server answers with the word, so the back of
  // the card may not have content yet; it falls back to a loading line.
  const round = game.round;
  const isImpostor = current !== null && game.impostor[current];

  return (
    <>
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

      {/* The picked player's card pops up over the dimmed roster. */}
      {current !== null && (
        <div className="card-overlay" role="dialog" aria-modal="true">
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
              <div
                className={`flip-face flip-back ${isImpostor ? 'impostor' : ''}`}
                aria-hidden={!flipped}
              >
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

          {/* Always rendered so revealing the card doesn't shift it upward;
              just hidden (but still occupying its space) until flipped. */}
          <button
            className={`button primary big ${flipped ? '' : 'invisible'}`}
            disabled={!flipped || !round}
            onClick={close}
          >
            {m.hide}
          </button>
        </div>
      )}
    </>
  );
}
