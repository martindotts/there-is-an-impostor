import type { ActiveGame, Winner } from '../game';
import { useI18n } from '../i18n';

interface Props {
  game: ActiveGame;
  /** Null when the group skipped the voting with "reveal everyone". */
  winner: Winner | null;
  onPlayAgain: () => void;
  onExit: () => void;
}

export function ResultsScreen({ game, winner, onPlayAgain, onExit }: Props) {
  const { m } = useI18n();
  const impostors = game.players.filter((_, i) => game.impostor[i]);
  const impostorsWon = winner === 'impostors';

  return (
    <div className={`centered results ${winner === null ? 'revealed' : impostorsWon ? 'impostor' : ''}`}>
      <div className="logo">{winner === null ? '👀' : impostorsWon ? '🕵️' : '🎉'}</div>
      <h1>{winner === null ? m.allRevealed : impostorsWon ? m.impostorsWin : m.companionsWin}</h1>
      {winner === null ? (
        <ul className="role-list">
          {game.players.map((name, i) => (
            <li key={i} className={game.impostor[i] ? 'impostor' : ''}>
              <span className="roster-name">{name}</span>
              <span className="role-tag">{game.impostor[i] ? m.roleImpostor : m.roleCompanion}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p>
          <span className="muted">{m.impostorsWereLabel(impostors.length)}</span>{' '}
          <strong>{impostors.join(', ')}</strong>
        </p>
      )}
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
