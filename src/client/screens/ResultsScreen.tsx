import type { ActiveGame } from '../game';
import { useI18n } from '../i18n';

interface Props {
  game: ActiveGame;
  onPlayAgain: () => void;
  onExit: () => void;
}

export function ResultsScreen({ game, onPlayAgain, onExit }: Props) {
  const { m } = useI18n();
  const impostors = game.players.filter((_, i) => game.impostor[i]);

  return (
    <div className="centered results">
      <div className="logo">🎭</div>
      <h1>{m.theReveal}</h1>
      {game.round && (
        <>
          <p className="muted">{m.secretWordWas}</p>
          <h2 className="secret">{game.round.word}</h2>
          {game.showHint && <p className="muted">{m.hintWas(game.round.hint)}</p>}
        </>
      )}
      <div className="impostor-list">
        {impostors.map((name, i) => (
          <div key={i} className="impostor-tag">
            🕵️ {name}
          </div>
        ))}
      </div>
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
