import { useEffect, useMemo, useState } from 'react';
import type { Category, StartGameRequest } from '../../shared/types';
import { MAX_PLAYERS, MIN_PLAYERS, maxImpostors } from '../../shared/types';

interface Props {
  categories: Category[];
  initialConfig: StartGameRequest | null;
  onStart: (config: StartGameRequest) => void;
}

export function SetupScreen({ categories, initialConfig, onStart }: Props) {
  // All categories selected by default.
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(initialConfig?.categoryIds ?? categories.map((c) => c.id)),
  );
  const [players, setPlayers] = useState(initialConfig?.playerCount ?? 6);
  const [impostors, setImpostors] = useState(initialConfig?.impostorCount ?? 1);
  const [starting, setStarting] = useState(false);

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
      <h1>New game</h1>

      <section>
        <div className="section-header">
          <h2>Categories</h2>
          <button
            className="link-button"
            onClick={() =>
              setSelected(allSelected ? new Set() : new Set(categories.map((c) => c.id)))
            }
          >
            {allSelected ? 'Clear all' : 'Select all'}
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
        {selected.size === 0 && <p className="muted small">Select at least one category.</p>}
      </section>

      <section>
        <h2>Players</h2>
        <Stepper
          value={players}
          min={MIN_PLAYERS}
          max={MAX_PLAYERS}
          onChange={setPlayers}
          label={`${players} players`}
        />
      </section>

      <section>
        <h2>Impostors</h2>
        <Stepper
          value={impostors}
          min={1}
          max={impostorCap}
          onChange={setImpostors}
          label={`${impostors} impostor${impostors > 1 ? 's' : ''}`}
        />
        <p className="muted small">Up to {impostorCap} for {players} players.</p>
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
        {starting ? 'Starting…' : 'Start game'}
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
  return (
    <div className="stepper">
      <button
        className="button round"
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        aria-label="decrease"
      >
        −
      </button>
      <span className="stepper-value">{label}</span>
      <button
        className="button round"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        aria-label="increase"
      >
        +
      </button>
    </div>
  );
}
