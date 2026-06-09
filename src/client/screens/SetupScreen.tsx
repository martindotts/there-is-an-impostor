import { useEffect, useState } from 'react';
import type { Category, StartGameRequest } from '../../shared/types';
import { MAX_PLAYERS, MIN_PLAYERS, maxImpostors } from '../../shared/types';
import { useI18n } from '../i18n';

interface Props {
  categories: Category[];
  initialConfig: StartGameRequest | null;
  onStart: (config: StartGameRequest) => void;
  onBack: () => void;
}

/** Two-step game setup: 1) categories, 2) players & impostors. */
export function SetupScreen({ categories, initialConfig, onStart, onBack }: Props) {
  const { m } = useI18n();
  const [step, setStep] = useState<1 | 2>(1);
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
              <span className="muted small">
                {m.selectAtLeastOne}
              </span>
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
            disabled={starting}
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
        </>
      )}
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
