import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { decode } from 'hono/jwt';
import type { SessionUser } from '../shared/types';
import type { AppContext, UserRow } from './types';
import { createSession, clearSession } from './session';

const STATE_COOKIE = 'oauth_state';

export const authRoutes = new Hono<AppContext>();

function randomState(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function b64url(data: Uint8Array | string): string {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function upsertUser(
  db: D1Database,
  provider: string,
  providerId: string,
  email: string | null,
  name: string | null,
  picture: string | null,
): Promise<SessionUser> {
  const row = await db
    .prepare(
      `INSERT INTO users (provider, provider_id, email, name, picture) VALUES (?1, ?2, ?3, ?4, ?5)
       ON CONFLICT(provider, provider_id) DO UPDATE SET
         email = COALESCE(excluded.email, users.email),
         name = COALESCE(excluded.name, users.name),
         picture = COALESCE(excluded.picture, users.picture)
       RETURNING id, provider, provider_id, email, name, picture`,
    )
    .bind(provider, providerId, email, name, picture)
    .first<UserRow>();
  if (!row) throw new Error('failed to upsert user');
  return {
    id: row.id,
    name: row.name ?? row.email?.split('@')[0] ?? 'Player',
    email: row.email,
    provider: row.provider,
    picture: row.picture,
  };
}

// ---------------------------------------------------------------------------
// Google (OIDC authorization code flow)
// ---------------------------------------------------------------------------

authRoutes.get('/google', (c) => {
  if (!c.env.GOOGLE_CLIENT_ID || !c.env.GOOGLE_CLIENT_SECRET) {
    return c.text('Google login is not configured', 501);
  }
  const origin = new URL(c.req.url).origin;
  const state = randomState();
  setCookie(c, STATE_COOKIE, state, {
    httpOnly: true,
    secure: origin.startsWith('https:'),
    sameSite: 'Lax',
    path: '/',
    maxAge: 600,
  });
  const params = new URLSearchParams({
    client_id: c.env.GOOGLE_CLIENT_ID,
    redirect_uri: `${origin}/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    state,
  });
  return c.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

authRoutes.get('/google/callback', async (c) => {
  const url = new URL(c.req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const expected = getCookie(c, STATE_COOKIE);
  deleteCookie(c, STATE_COOKIE, { path: '/' });
  if (!code || !state || state !== expected) {
    return c.text('Invalid OAuth state', 400);
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: c.env.GOOGLE_CLIENT_ID!,
      client_secret: c.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${url.origin}/auth/google/callback`,
      grant_type: 'authorization_code',
    }),
  });
  if (!tokenRes.ok) {
    return c.text('Google token exchange failed', 502);
  }
  const tokens = (await tokenRes.json()) as { id_token?: string };
  if (!tokens.id_token) return c.text('Missing id_token', 502);

  // The id_token came straight from Google's token endpoint over TLS, so the
  // payload can be trusted without re-verifying the signature.
  const { payload } = decode(tokens.id_token);
  if (typeof payload.sub !== 'string') return c.text('Malformed id_token', 502);
  const email = typeof payload.email === 'string' ? payload.email : null;
  const name = typeof payload.name === 'string' ? payload.name : null;
  const picture = typeof payload.picture === 'string' ? payload.picture : null;

  const user = await upsertUser(c.env.DB, 'google', payload.sub, email, name, picture);
  await createSession(c, user);
  return c.redirect('/');
});

// ---------------------------------------------------------------------------
// Apple (Sign in with Apple, form_post response mode)
// ---------------------------------------------------------------------------

function appleConfigured(env: AppContext['Bindings']): boolean {
  return Boolean(env.APPLE_CLIENT_ID && env.APPLE_TEAM_ID && env.APPLE_KEY_ID && env.APPLE_PRIVATE_KEY);
}

async function appleClientSecret(env: AppContext['Bindings']): Promise<string> {
  const pem = env.APPLE_PRIVATE_KEY!.replace(/\\n/g, '\n');
  const der = Uint8Array.from(
    atob(pem.replace(/-----(BEGIN|END) PRIVATE KEY-----|\s/g, '')),
    (ch) => ch.charCodeAt(0),
  );
  const key = await crypto.subtle.importKey(
    'pkcs8',
    der,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'ES256', kid: env.APPLE_KEY_ID }));
  const payload = b64url(
    JSON.stringify({
      iss: env.APPLE_TEAM_ID,
      iat: now,
      exp: now + 600,
      aud: 'https://appleid.apple.com',
      sub: env.APPLE_CLIENT_ID,
    }),
  );
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(`${header}.${payload}`),
  );
  return `${header}.${payload}.${b64url(new Uint8Array(signature))}`;
}

authRoutes.get('/apple', (c) => {
  if (!appleConfigured(c.env)) {
    return c.text('Apple login is not configured', 501);
  }
  const origin = new URL(c.req.url).origin;
  const state = randomState();
  // Apple posts the callback cross-site, so the state cookie must be SameSite=None.
  setCookie(c, STATE_COOKIE, state, {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
    path: '/',
    maxAge: 600,
  });
  const params = new URLSearchParams({
    client_id: c.env.APPLE_CLIENT_ID!,
    redirect_uri: `${origin}/auth/apple/callback`,
    response_type: 'code',
    scope: 'name email',
    response_mode: 'form_post',
    state,
  });
  return c.redirect(`https://appleid.apple.com/auth/authorize?${params}`);
});

authRoutes.post('/apple/callback', async (c) => {
  const form = await c.req.formData();
  const code = form.get('code');
  const state = form.get('state');
  const expected = getCookie(c, STATE_COOKIE);
  deleteCookie(c, STATE_COOKIE, { path: '/' });
  if (typeof code !== 'string' || typeof state !== 'string' || state !== expected) {
    return c.text('Invalid OAuth state', 400);
  }

  const origin = new URL(c.req.url).origin;
  const tokenRes = await fetch('https://appleid.apple.com/auth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: c.env.APPLE_CLIENT_ID!,
      client_secret: await appleClientSecret(c.env),
      redirect_uri: `${origin}/auth/apple/callback`,
      grant_type: 'authorization_code',
    }),
  });
  if (!tokenRes.ok) {
    return c.text('Apple token exchange failed', 502);
  }
  const tokens = (await tokenRes.json()) as { id_token?: string };
  if (!tokens.id_token) return c.text('Missing id_token', 502);

  const { payload } = decode(tokens.id_token);
  if (typeof payload.sub !== 'string') return c.text('Malformed id_token', 502);
  const email = typeof payload.email === 'string' ? payload.email : null;

  // Apple only sends the user's name in the `user` form field on first login.
  let name: string | null = null;
  const userField = form.get('user');
  if (typeof userField === 'string') {
    try {
      const parsed = JSON.parse(userField) as { name?: { firstName?: string; lastName?: string } };
      name = [parsed.name?.firstName, parsed.name?.lastName].filter(Boolean).join(' ') || null;
    } catch {
      // ignore malformed user payload
    }
  }

  const user = await upsertUser(c.env.DB, 'apple', payload.sub, email, name, null);
  await createSession(c, user);
  return c.redirect('/');
});

// ---------------------------------------------------------------------------
// Local development login (enabled only when DEV_AUTH=true)
// ---------------------------------------------------------------------------

authRoutes.get('/dev', async (c) => {
  if (c.env.DEV_AUTH !== 'true') return c.text('Not found', 404);
  const name = new URL(c.req.url).searchParams.get('name') ?? 'Dev Player';
  const user = await upsertUser(c.env.DB, 'dev', name.toLowerCase(), `${name.toLowerCase()}@example.dev`, name, null);
  await createSession(c, user);
  return c.redirect('/');
});

authRoutes.post('/logout', (c) => {
  clearSession(c);
  return c.json({ ok: true });
});
