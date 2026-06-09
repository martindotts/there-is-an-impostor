import type { Context } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { sign, verify } from 'hono/jwt';
import type { SessionUser } from '../shared/types';
import type { AppContext } from './types';

const SESSION_COOKIE = 'session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export async function createSession(c: Context<AppContext>, user: SessionUser): Promise<void> {
  const token = await sign(
    {
      sub: String(user.id),
      name: user.name,
      email: user.email,
      provider: user.provider,
      picture: user.picture,
      exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    },
    c.env.SESSION_SECRET,
  );
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    secure: new URL(c.req.url).protocol === 'https:',
    sameSite: 'Lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function getSessionUser(c: Context<AppContext>): Promise<SessionUser | null> {
  const token = getCookie(c, SESSION_COOKIE);
  if (!token) return null;
  try {
    const payload = await verify(token, c.env.SESSION_SECRET, 'HS256');
    return {
      id: Number(payload.sub),
      name: String(payload.name ?? 'Player'),
      email: payload.email == null ? null : String(payload.email),
      provider: String(payload.provider ?? 'unknown'),
      picture: payload.picture == null ? null : String(payload.picture),
    };
  } catch {
    return null;
  }
}

export function clearSession(c: Context<AppContext>): void {
  deleteCookie(c, SESSION_COOKIE, { path: '/' });
}
