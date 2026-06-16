import type { ActiveGame, Winner } from '../game';
import { useI18n } from '../i18n';

interface Props {
  game: ActiveGame;
  winner: Winner;
  onPlayAgain: () => void;
  onExit: () => void;
}

export function ResultsScreen({ game, winner, onPlayAgain, onExit }: Props) {
  const { m } = useI18n();
  const impostors = game.players.filter((_, i) => game.impostor[i]);
  const impostorsWon = winner === 'impostors';

  return (
    <div className={`centered results ${impostorsWon ? 'impostor' : ''}`}>
      <div className="logo">{impostorsWon ? '🕵️' : '🎉'}</div>
      <h1>{impostorsWon ? m.impostorsWin : m.companionsWin}</h1>
      <p>
        <span className="muted">{m.impostorsWereLabel(impostors.length)}</span>{' '}
        <strong>{impostors.join(', ')}</strong>
      </p>
      {game.round && (
        <>
          <p>
            <span className="muted">{m.secretWordWas}</span> <strong>{game.round.word}</strong>
          </p>
          {game.showHint && (
            <p>
              <span className="muted">{m.hintWasLabel}</span> <strong>{game.round.hint}</strong>
            </p>
          )}
        </>
      )}
      <div className="button-row">
        <button className="button primary big" onClick={onPlayAgain}>
          {m.playAgain}
        </button>
        <button className="button big" onClick={onExit}>
          {m.exit}
        </button>
      </div>
    </div>
  );
}
