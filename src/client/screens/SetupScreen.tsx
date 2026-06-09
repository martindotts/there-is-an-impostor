import { useEffect, useMemo, useState } from 'react';
import type { Category, StartGameRequest } from '../../shared/types';
import { MAX_PLAYERS, MIN_PLAYERS, maxImpostors } from '../../shared/types';
import { useI18n } from '../i18n';

interface Props {
  categories: Category[];
  initialConfig: StartGameRequest | null;
  onStart: (config: StartGameRequest) => void;
}

export function SetupScreen({ categories, initialConfig, onStart }: Props) {
  const { m } = useI18n();
  // All categories selected by default.
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(initialConfig?.categoryIds ?? categories.map((c) => c.id)),
  );
  const [players, setPlayers] = useState(initialConfig?.playerCount ?? 6);
  const [impostors, setImpostors] = useState(initialConfig?.impostorCount ?? 1);
  const [starting, setStarting] = useState(false);

  // The category list can arrive (or change) after mount; default to all selected
  // unless the user is restoring a previous config.
  useEffect(() => {
    if (!initialConfig) setSelected(new Set(categories.map((c) => c.id)));
  }, [categories, initialConfig]);

  const impostorCap = maxImpostors(players);
  useEffect(() => {
    if (impostors > impostorCap) setImpostors(impostorCap);
  }, [impostors, impostorCap]);

  const allSelected = selected.size === categories.length;
  const canStart = useMemo(() => selected.size > 0 && !starting, [selected, starting]);

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
      <h1>{m.newGame}</h1>

      <section>
        <div className="section-header">
          <h2>{m.categories}</h2>
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
        {selected.size === 0 && <p className="muted small">{m.selectAtLeastOne}</p>}
      </section>

      <section>
        <h2>{m.players}</h2>
        <Stepper
          value={players}
          min={MIN_PLAYERS}
          max={MAX_PLAYERS}
          onChange={setPlayers}
          label={m.playersLabel(players)}
        />
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
        <p className="muted small">{m.impostorsCap(impostorCap, players)}</p>
      </section>

      <button
        className="button primary big"
        disabled={!canStart}
        onClick={async () => {
          setStarting(true);
          try {
            await onStart({
              categoryIds: [...selected],
              playerCount: players,
              impostorCount: impostors,
            });
          } finally {
            setStarting(false);
          }
        }}
      >
        {starting ? m.starting : m.startGame}
      </button>
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
