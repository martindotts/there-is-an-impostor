import { useCallback, useEffect, useState } from 'react';
import type { Category, SessionUser, StartGameRequest } from '../shared/types';
import { api } from './api';
import type { ActiveGame } from './game';
import { buildGame } from './game';
import { LocaleSwitcher, useI18n } from './i18n';
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
  const { locale, m } = useI18n();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [screen, setScreen] = useState<Screen>({ name: 'loading' });
  const [lastConfig, setLastConfig] = useState<StartGameRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    api
      .me()
      .then(({ user }) => {
        setUser(user);
        setScreen(user ? { name: 'setup' } : { name: 'login' });
      })
      .catch((err: Error) => {
        setError(err.message);
        setScreen({ name: 'login' });
      });
  }, []);

  // Categories are localized server-side, so refetch when the language changes.
  useEffect(() => {
    if (!user) return;
    api
      .categories(locale)
      .then(({ categories }) => setCategories(categories))
      .catch((err: Error) => setError(err.message));
  }, [user, locale]);

  const startGame = useCallback(
    async (config: StartGameRequest) => {
      setError(null);
      setNotice(null);
      try {
        const localized = { ...config, locale };
        const { round, poolReset } = await api.startGame(localized);
        setLastConfig(localized);
        if (poolReset) setNotice(m.poolReset);
        setScreen({
          name: 'reveal',
          game: buildGame(round, config.playerCount, config.impostorCount),
        });
      } catch (err) {
        setError((err as Error).message);
      }
    },
    [locale, m],
  );

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
          <span className="topbar-actions">
            <LocaleSwitcher />
            <button className="link-button" onClick={logout}>
              {m.signOut}
            </button>
          </span>
        </header>
      )}

      {error && <div className="error-banner">{error}</div>}
      {notice && screen.name === 'reveal' && <div className="info-banner">{notice}</div>}

      {screen.name === 'loading' && <div className="centered muted">{m.loading}</div>}

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
