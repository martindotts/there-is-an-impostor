import type { ActiveGame } from '../game';

interface Props {
  game: ActiveGame;
  onReveal: () => void;
}

export function DiscussionScreen({ game, onReveal }: Props) {
  const impostorCount = game.impostor.filter(Boolean).length;
  return (
    <div className="centered discussion">
      <div className="logo">🗣️</div>
      <h1>Discussion time</h1>
      <p className="muted">Category: {game.round.category}</p>
      <p>
        <strong>Player {game.startingPlayer}</strong> starts. Going around, everyone says one word
        or phrase about the secret word. Then vote on who the {impostorCount > 1 ? 'impostors are' : 'impostor is'}.
      </p>
      <p className="muted small">
        {impostorCount} impostor{impostorCount > 1 ? 's are' : ' is'} hiding among you.
      </p>
      <button className="button primary big" onClick={onReveal}>
        Reveal the impostors
      </button>
    </div>
  );
}
