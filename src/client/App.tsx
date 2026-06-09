import { useCallback, useEffect, useState } from 'react';
import type { Category, SessionUser, StartGameRequest } from '../shared/types';
import { api } from './api';
import type { ActiveGame } from './game';
import { buildGame } from './game';
import { LoginScreen } from './screens/LoginScreen';
import { SetupScreen } from './screens/SetupScreen';
import { RevealScreen } from './screens/RevealScreen';
import { DiscussionScreen } from './screens/DiscussionScreen';
import { ResultsScreen } from './screens/ResultsScreen';

type Screen =
  | { name: 'loading' }
  | { name: 'login' }
  | { name: 'setup' }
  | { name: 'reveal'; game: ActiveGame }
  | { name: 'discussion'; game: ActiveGame }
  | { name: 'results'; game: ActiveGame };

export function App() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [screen, setScreen] = useState<Screen>({ name: 'loading' });
  const [lastConfig, setLastConfig] = useState<StartGameRequest | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .me()
      .then(async ({ user }) => {
        if (!user) {
          setScreen({ name: 'login' });
          return;
        }
        setUser(user);
        const { categories } = await api.categories();
        setCategories(categories);
        setScreen({ name: 'setup' });
      })
      .catch((err: Error) => {
        setError(err.message);
        setScreen({ name: 'login' });
      });
  }, []);

  const startGame = useCallback(async (config: StartGameRequest) => {
    setError(null);
    try {
      const { round } = await api.startGame(config);
      setLastConfig(config);
      setScreen({ name: 'reveal', game: buildGame(round, config.playerCount, config.impostorCount) });
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
    setScreen({ name: 'login' });
  }, []);

  return (
    <div className="app">
      {user && screen.name === 'setup' && (
        <header className="topbar">
          <span className="topbar-user">{user.name}</span>
          <button className="link-button" onClick={logout}>
            Sign out
          </button>
        </header>
      )}

      {error && <div className="error-banner">{error}</div>}

      {screen.name === 'loading' && <div className="centered muted">Loading…</div>}

      {screen.name === 'login' && <LoginScreen />}

      {screen.name === 'setup' && (
        <SetupScreen categories={categories} initialConfig={lastConfig} onStart={startGame} />
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
