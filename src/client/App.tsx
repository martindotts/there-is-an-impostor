import { useCallback, useEffect, useState } from 'react';
import type { Category, Player, SessionUser } from '../shared/types';
import { api } from './api';
import type { ActiveGame } from './game';
import { buildGame } from './game';
import { useI18n } from './i18n';
import { LoginScreen } from './screens/LoginScreen';
import { HomeScreen } from './screens/HomeScreen';
import { SetupScreen } from './screens/SetupScreen';
import { RevealScreen } from './screens/RevealScreen';
import { DiscussionScreen } from './screens/DiscussionScreen';
import { ResultsScreen } from './screens/ResultsScreen';

type Screen =
  | { name: 'loading' }
  | { name: 'login' }
  | { name: 'home' }
  | { name: 'setup' }
  | { name: 'reveal'; game: ActiveGame }
  | { name: 'discussion'; game: ActiveGame }
  | { name: 'results'; game: ActiveGame };

export interface GameConfig {
  categoryIds: number[];
  impostorCount: number;
}

export function App() {
  const { locale, m } = useI18n();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [screen, setScreen] = useState<Screen>({ name: 'loading' });
  const [lastConfig, setLastConfig] = useState<GameConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    api
      .me()
      .then(({ user }) => {
        setUser(user);
        setScreen(user ? { name: 'home' } : { name: 'login' });
      })
      .catch((err: Error) => {
        setError(err.message);
        setScreen({ name: 'login' });
      });
  }, []);

  // Categories are localized server-side, so refetch when the language changes.
  // The roster only depends on locale for the very first seed.
  useEffect(() => {
    if (!user) return;
    Promise.all([api.categories(locale), api.players(locale)])
      .then(([{ categories }, { players }]) => {
        setCategories(categories);
        setPlayers(players);
      })
      .catch((err: Error) => setError(err.message));
  }, [user, locale]);

  const addPlayer = useCallback(async (name: string) => {
    const { player } = await api.addPlayer(name);
    setPlayers((prev) => [...prev, player]);
  }, []);

  const removePlayer = useCallback(async (id: number) => {
    await api.removePlayer(id);
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const startGame = useCallback(
    async (config: GameConfig) => {
      setError(null);
      setNotice(null);
      try {
        const { round, poolReset } = await api.startGame({
          ...config,
          playerCount: players.length,
          locale,
        });
        setLastConfig(config);
        if (poolReset) setNotice(m.poolReset);
        setScreen({
          name: 'reveal',
          game: buildGame(
            round,
            players.map((p) => p.name),
            config.impostorCount,
          ),
        });
      } catch (err) {
        setError((err as Error).message);
      }
    },
    [locale, m, players],
  );

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
    setPlayers([]);
    setLastConfig(null);
    setScreen({ name: 'login' });
  }, []);

  return (
    <div className="app">
      {error && <div className="error-banner">{error}</div>}
      {notice && screen.name === 'reveal' && <div className="info-banner">{notice}</div>}

      {screen.name === 'loading' && <div className="centered muted">{m.loading}</div>}

      {screen.name === 'login' && <LoginScreen />}

      {screen.name === 'home' && user && (
        <HomeScreen user={user} onNewGame={() => setScreen({ name: 'setup' })} onLogout={logout} />
      )}

      {screen.name === 'setup' && (
        <SetupScreen
          categories={categories}
          players={players}
          initialConfig={lastConfig}
          onAddPlayer={addPlayer}
          onRemovePlayer={removePlayer}
          onStart={startGame}
          onBack={() => setScreen({ name: 'home' })}
        />
      )}

      {screen.name === 'reveal' && (
        <RevealScreen
          game={screen.game}
          onDone={() => setScreen({ name: 'discussion', game: screen.game })}
        />
      )}

      {screen.name === 'discussion' && (
        <DiscussionScreen
          game={screen.game}
          onReveal={() => setScreen({ name: 'results', game: screen.game })}
        />
      )}

      {screen.name === 'results' && (
        <ResultsScreen
          game={screen.game}
          onPlayAgain={() => lastConfig && startGame(lastConfig)}
          onNewSetup={() => setScreen({ name: 'setup' })}
        />
      )}
    </div>
  );
}
