import type {
  Category,
  Player,
  Providers,
  SessionUser,
  StartGameRequest,
  StartGameResponse,
  UpdateSettingsRequest,
  UserSettings,
} from '../shared/types';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // keep default message
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export const api = {
  me: () => request<{ user: SessionUser | null; settings: UserSettings | null }>('/api/me'),
  updateSettings: (body: UpdateSettingsRequest) =>
    request<{ settings: UserSettings }>('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  providers: () => request<Providers>('/api/providers'),
  categories: (locale: string) =>
    request<{ categories: Category[] }>(`/api/categories?locale=${encodeURIComponent(locale)}`),
  players: (locale: string) =>
    request<{ players: Player[] }>(`/api/players?locale=${encodeURIComponent(locale)}`),
  addPlayer: (name: string) =>
    request<{ player: Player }>('/api/players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    }),
  removePlayer: (id: number) =>
    request<{ ok: boolean }>(`/api/players/${id}`, { method: 'DELETE' }),
  startGame: (body: StartGameRequest) =>
    request<StartGameResponse>('/api/game/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  logout: () => request<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
};
