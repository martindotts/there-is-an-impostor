import type {
  Category,
  GameRound,
  Providers,
  SessionUser,
  StartGameRequest,
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
  me: () => request<{ user: SessionUser | null }>('/api/me'),
  providers: () => request<Providers>('/api/providers'),
  categories: () => request<{ categories: Category[] }>('/api/categories'),
  startGame: (body: StartGameRequest) =>
    request<{ round: GameRound }>('/api/game/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  logout: () => request<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
};
