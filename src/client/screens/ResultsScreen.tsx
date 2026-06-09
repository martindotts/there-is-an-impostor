import type { ActiveGame } from '../game';

interface Props {
  game: ActiveGame;
  onPlayAgain: () => void;
  onNewSetup: () => void;
}

export function ResultsScreen({ game, onPlayAgain, onNewSetup }: Props) {
  const impostors = game.impostor
    .map((isImpostor, i) => (isImpostor ? i + 1 : null))
    .filter((n): n is number => n !== null);

  return (
    <div className="centered results">
      <div className="logo">🎭</div>
      <h1>The reveal</h1>
      <p className="muted">The secret word was:</p>
      <h2 className="secret">{game.round.word}</h2>
      <p className="muted">The impostor hint was “{game.round.hint}”.</p>
      <div className="impostor-list">
        {impostors.map((n) => (
          <div key={n} className="impostor-tag">
            🕵️ Player {n}
          </div>
        ))}
      </div>
      <div className="button-row">
        <button className="button primary big" onClick={onPlayAgain}>
          Play again
        </button>
        <button className="button big" onClick={onNewSetup}>
          Change setup
        </button>
      </div>
    </div>
  );
}
