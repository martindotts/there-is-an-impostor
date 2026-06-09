import type { ActiveGame } from '../game';
import { useI18n } from '../i18n';

interface Props {
  game: ActiveGame;
  onPlayAgain: () => void;
  onNewSetup: () => void;
}

export function ResultsScreen({ game, onPlayAgain, onNewSetup }: Props) {
  const { m } = useI18n();
  const impostors = game.impostor
    .map((isImpostor, i) => (isImpostor ? i + 1 : null))
    .filter((n): n is number => n !== null);

  return (
    <div className="centered results">
      <div className="logo">🎭</div>
      <h1>{m.theReveal}</h1>
      <p className="muted">{m.secretWordWas}</p>
      <h2 className="secret">{game.round.word}</h2>
      <p className="muted">{m.hintWas(game.round.hint)}</p>
      <div className="impostor-list">
        {impostors.map((n) => (
          <div key={n} className="impostor-tag">
            🕵️ {m.playerName(n)}
          </div>
        ))}
      </div>
      <div className="button-row">
        <button className="button primary big" onClick={onPlayAgain}>
          {m.playAgain}
        </button>
        <button className="button big" onClick={onNewSetup}>
          {m.changeSetup}
        </button>
      </div>
    </div>
  );
}
