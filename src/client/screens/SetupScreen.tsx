import { useEffect, useState } from 'react';
import type { Category, Player } from '../../shared/types';
import { MAX_PLAYERS, MAX_PLAYER_NAME_LENGTH, MIN_PLAYERS, maxImpostors } from '../../shared/types';
import type { GameConfig } from '../App';
import { useI18n } from '../i18n';

interface Props {
  categories: Category[];
  players: Player[];
  initialConfig: GameConfig | null;
  onAddPlayer: (name: string) => void;
  onRemovePlayer: (id: number) => void;
  onStart: (config: GameConfig) => void;
  onBack: () => void;
}

/** Two-step game setup: 1) categories, 2) player roster & impostors. */
export function SetupScreen({
  categories,
  players,
  initialConfig,
  onAddPlayer,
  onRemovePlayer,
  onStart,
  onBack,
}: Props) {
  const { m } = useI18n();
  const [step, setStep] = useState<1 | 2>(1);
  // All categories selected by default.
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(initialConfig?.categoryIds ?? categories.map((c) => c.id)),
  );
  const [impostors, setImpostors] = useState(initialConfig?.impostorCount ?? 1);

  // The category list can arrive (or change) after mount; default to all selected
  // unless the user is restoring a previous config.
  useEffect(() => {
    if (!initialConfig) setSelected(new Set(categories.map((c) => c.id)));
  }, [categories, initialConfig]);

  const impostorCap = maxImpostors(players.length);
  useEffect(() => {
    if (impostors > impostorCap) setImpostors(impostorCap);
  }, [impostors, impostorCap]);

  const allSelected = selected.size === categories.length;
  const enoughPlayers = players.length >= MIN_PLAYERS;

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="setup">
      <div className="setup-header">
        <button
          className="button round back"
          aria-label={m.back}
          onClick={() => (step === 1 ? onBack() : setStep(1))}
        >
          ←
        </button>
        <span className="muted small">{m.stepOf(step, 2)}</span>
      </div>

      {step === 1 ? (
        <>
          <h1>{m.categories}</h1>
          <section>
            <div className="section-header">
              <span className="muted small">{m.selectAtLeastOne}</span>
              <button
                className="link-button"
                onClick={() =>
                  setSelected(allSelected ? new Set() : new Set(categories.map((c) => c.id)))
                }
              >
                {allSelected ? m.clearAll : m.selectAll}
              </button>
            </div>
            <div className="category-grid">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  className={`category-chip ${selected.has(cat.id) ? 'selected' : ''}`}
                  onClick={() => toggle(cat.id)}
                  aria-pressed={selected.has(cat.id)}
                >
                  <span className="category-emoji">{cat.emoji}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </section>
          <button
            className="button primary big"
            disabled={selected.size === 0}
            onClick={() => setStep(2)}
          >
            {m.next}
          </button>
        </>
      ) : (
        <>
          <h1>{m.playersAndImpostors}</h1>

          <section>
            <h2>{m.playersWithCount(players.length)}</h2>
            <RosterEditor players={players} onAdd={onAddPlayer} onRemove={onRemovePlayer} />
            {!enoughPlayers && <p className="muted small">{m.needMorePlayers(MIN_PLAYERS)}</p>}
          </section>

          <section>
            <h2>{m.impostors}</h2>
            <Stepper
              value={impostors}
              min={1}
              max={impostorCap}
              onChange={setImpostors}
              label={m.impostorsLabel(impostors)}
            />
            <p className="muted small">{m.impostorsCap(impostorCap, players.length)}</p>
          </section>

          <button
            className="button primary big"
            disabled={!enoughPlayers}
            onClick={() => onStart({ categoryIds: [...selected], impostorCount: impostors })}
          >
            {m.startGame}
          </button>
        </>
      )}
    </div>
  );
}

function RosterEditor({
  players,
  onAdd,
  onRemove,
}: {
  players: Player[];
  onAdd: (name: string) => void;
  onRemove: (id: number) => void;
}) {
  const { m } = useI18n();
  const [name, setName] = useState('');

  const atCap = players.length >= MAX_PLAYERS;
  const canAdd = name.trim().length > 0 && !atCap;

  const add = () => {
    if (!canAdd) return;
    onAdd(name.trim());
    setName('');
  };

  return (
    <div className="roster">
      <ul className="roster-list">
        {players.map((p) => (
          <li key={p.id} className="roster-item">
            <span className="roster-name">{p.name}</span>
            <button
              className="roster-remove"
              aria-label={m.removePlayer(p.name)}
              onClick={() => onRemove(p.id)}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
      <div className="roster-add">
        <input
          className="text-input"
          value={name}
          maxLength={MAX_PLAYER_NAME_LENGTH}
          placeholder={m.playerNamePlaceholder}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          disabled={atCap}
        />
        <button className="button" disabled={!canAdd} onClick={add}>
          {m.addPlayer}
        </button>
      </div>
      {atCap && <p className="muted small">{m.maxPlayersReached(MAX_PLAYERS)}</p>}
    </div>
  );
}

function Stepper({
  value,
  min,
  max,
  onChange,
  label,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  label: string;
}) {
  const { m } = useI18n();
  return (
    <div className="stepper">
      <button
        className="button round"
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        aria-label={m.decrease}
      >
        −
      </button>
      <span className="stepper-value">{label}</span>
      <button
        className="button round"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        aria-label={m.increase}
      >
        +
      </button>
    </div>
  );
}
