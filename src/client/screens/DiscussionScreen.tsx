import type { ActiveGame } from '../game';
import { useI18n } from '../i18n';

interface Props {
  game: ActiveGame;
  onStartVoting: () => void;
}

export function DiscussionScreen({ game, onStartVoting }: Props) {
  const { m } = useI18n();
  return (
    <div className="centered discussion">
      <div className="logo">🗣️</div>
      <h1>{m.discussionTime}</h1>
      <p>
        {m.startsLabel} <strong>{game.players[game.startingPlayer]}</strong>
      </p>
      <p className="muted">{m.discussionRules}</p>
      <button className="button primary big" onClick={onStartVoting}>
        {m.startVoting}
      </button>
    </div>
  );
}
