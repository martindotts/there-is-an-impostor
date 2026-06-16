import type { ActiveGame } from '../game';
import { useI18n } from '../i18n';

interface Props {
  game: ActiveGame;
  onReveal: () => void;
}

export function DiscussionScreen({ game, onReveal }: Props) {
  const { m } = useI18n();
  return (
    <div className="centered discussion">
      <div className="logo">🗣️</div>
      <h1>{m.discussionTime}</h1>
      <p>
        {m.startsLabel} <strong>{game.players[game.startingPlayer]}</strong>
      </p>
      <p>{m.discussionRules}</p>
      <button className="button primary big" onClick={onReveal}>
        {m.revealImpostors}
      </button>
    </div>
  );
}
