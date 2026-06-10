import type { ActiveGame } from '../game';
import { useI18n } from '../i18n';

interface Props {
  game: ActiveGame;
  onReveal: () => void;
}

export function DiscussionScreen({ game, onReveal }: Props) {
  const { m } = useI18n();
  const impostorCount = game.impostor.filter(Boolean).length;
  return (
    <div className="centered discussion">
      <div className="logo">🗣️</div>
      <h1>{m.discussionTime}</h1>
      {game.round && game.showCategory && (
        <p className="muted">{m.categoryLabel(game.round.category)}</p>
      )}
      <p>
        <strong>{game.players[game.startingPlayer]}</strong> {m.discussionRules(impostorCount)}
      </p>
      <p className="muted small">{m.impostorsHiding(impostorCount)}</p>
      <button className="button primary big" onClick={onReveal}>
        {m.revealImpostors}
      </button>
    </div>
  );
}
