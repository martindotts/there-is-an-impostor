import { useCallback, useEffect, useRef, useState } from 'react';
import type { Category, Player, SessionUser, UserSettings } from '../shared/types';
import { isLocale } from '../shared/i18n';
import { api } from './api';
import { clearCache, readCache, writeCache } from './cache';
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

const DEFAULT_SETTINGS: UserSettings = { locale: null, showHint: true, showCategory: true };

export function App() {
  const { locale, setLocale, m } = useI18n();
  // Paint instantly from the cached session; api.me() revalidates below.
  const [user, setUser] = useState<SessionUser | null>(() => readCache<SessionUser>('user'));
  const [categories, setCategories] = useState<Category[]>(
    () => readCache<Category[]>(`categories:${locale}`) ?? [],
  );
  const [players, setPlayers] = useState<Player[]>(() => readCache<Player[]>('players') ?? []);
  const [settings, setSettings] = useState<UserSettings>(
    () => readCache<UserSettings>('settings') ?? DEFAULT_SETTINGS,
  );
  const [screen, setScreen] = useState<Screen>(() =>
    readCache<SessionUser>('user') ? { name: 'home' } : { name: 'loading' },
  );
  const [lastConfig, setLastConfig] = useState<GameConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Optimistic adds in flight: temp (negative) id → whether the user already
  // removed the player again before the server confirmed the add.
  const pendingAdds = useRef(new Map<number, { cancelled: boolean }>());
  const nextTempId = useRef(-1);

  useEffect(() => {
    api
      .me()
      .then(({ user, settings: serverSettings }) => {
        setUser(user);
        if (user) {
          writeCache('user', user);
          if (serverSettings) {
            setSettings(serverSettings);
            // The account's language preference wins over the device default.
            if (serverSettings.locale && isLocale(serverSettings.locale)) {
              setLocale(serverSettings.locale);
            }
          }
          setScreen((prev) => (prev.name === 'loading' ? { name: 'home' } : prev));
        } else {
          clearCache();
          // Don't interrupt a running game; the session only matters again
          // on the next server interaction.
          setScreen((prev) =>
            prev.name === 'loading' || prev.name === 'home' || prev.name === 'setup'
              ? { name: 'login' }
              : prev,
          );
        }
      })
      .catch((err: Error) => {
        setError(err.message);
        setScreen((prev) => (prev.name === 'loading' ? { name: 'login' } : prev));
      });
  }, []);

  // Categories are localized server-side: render the cached list for this
  // locale immediately, then revalidate.
  useEffect(() => {
    if (!user) return;
    const cached = readCache<Category[]>(`categories:${locale}`);
    if (cached) setCategories(cached);
    api
      .categories(locale)
      .then(({ categories }) => {
        setCategories(categories);
        writeCache(`categories:${locale}`, categories);
      })
      .catch((err: Error) => setError(err.message));
  }, [user, locale]);

  // Roster: revalidate once per session (skip if optimistic edits are in
  // flight — they are already the freshest truth).
  useEffect(() => {
    if (!user) return;
    api
      .players(locale)
      .then(({ players }) => {
        if (pendingAdds.current.size === 0) setPlayers(players);
      })
      .catch((err: Error) => setError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Keep the roster cache in sync with confirmed players.
  useEffect(() => {
    if (user) writeCache('players', players.filter((p) => p.id > 0));
  }, [user, players]);

  useEffect(() => {
    if (user) writeCache('settings', settings);
  }, [user, settings]);

  // Persist the language choice to the account whenever it diverges (covers
  // both switcher changes and the first sign-in, where locale is still null).
  useEffect(() => {
    if (!user || settings.locale === locale) return;
    setSettings((prev) => ({ ...prev, locale }));
    api.updateSettings({ locale }).catch(() => {});
  }, [user, locale, settings.locale]);

  const updateSetting = useCallback(
    (patch: Partial<Pick<UserSettings, 'showHint' | 'showCategory'>>) => {
      const previous = settings;
      setSettings((prev) => ({ ...prev, ...patch }));
      api.updateSettings(patch).catch((err: Error) => {
        setSettings(previous);
        setError(err.message);
      });
    },
    [settings],
  );

  const addPlayer = useCallback((name: string) => {
    const tempId = nextTempId.current--;
    pendingAdds.current.set(tempId, { cancelled: false });
    setPlayers((prev) => [...prev, { id: tempId, name }]);
    api
      .addPlayer(name)
      .then(({ player }) => {
        const pending = pendingAdds.current.get(tempId);
        pendingAdds.current.delete(tempId);
        if (pending?.cancelled) {
          // Removed again before the server confirmed: delete it server-side.
          api.removePlayer(player.id).catch(() => {});
          return;
        }
        setPlayers((prev) => prev.map((p) => (p.id === tempId ? player : p)));
      })
      .catch((err: Error) => {
        pendingAdds.current.delete(tempId);
        setPlayers((prev) => prev.filter((p) => p.id !== tempId));
        setError(err.message);
      });
  }, []);

  const removePlayer = useCallback((id: number) => {
    let removed: Player | undefined;
    setPlayers((prev) => {
      removed = prev.find((p) => p.id === id);
      return prev.filter((p) => p.id !== id);
    });
    if (id < 0) {
      const pending = pendingAdds.current.get(id);
      if (pending) pending.cancelled = true;
      return;
    }
    api.removePlayer(id).catch((err: Error) => {
      if (removed) setPlayers((prev) => [...prev, removed!]);
      setError(err.message);
    });
  }, []);

  const startGame = useCallback(
    (config: GameConfig) => {
      setError(null);
      setNotice(null);
      setLastConfig(config);
      // Navigate immediately; roles are assigned client-side and the word is
      // attached to the game as soon as the server answers.
      setScreen({
        name: 'reveal',
        game: buildGame(
          players.map((p) => p.name),
          config.impostorCount,
          { showHint: settings.showHint, showCategory: settings.showCategory },
        ),
      });
      api
        .startGame({ ...config, playerCount: players.length, locale })
        .then(({ round, poolReset }) => {
          if (poolReset) setNotice(m.poolReset);
          setScreen((prev) =>
            'game' in prev ? { ...prev, game: { ...prev.game, round } } : prev,
          );
        })
        .catch((err: Error) => {
          setError(err.message);
          setScreen((prev) => (prev.name === 'reveal' ? { name: 'setup' } : prev));
        });
    },
    [locale, m, players, settings.showHint, settings.showCategory],
  );

  const logout = useCallback(() => {
    api.logout().catch(() => {});
    clearCache();
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
        <HomeScreen
          user={user}
          settings={settings}
          onUpdateSetting={updateSetting}
          onNewGame={() => setScreen({ name: 'setup' })}
          onLogout={logout}
        />
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
