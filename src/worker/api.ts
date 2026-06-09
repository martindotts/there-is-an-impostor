import { Hono } from 'hono';
import type {
  Category,
  GameRound,
  Player,
  Providers,
  StartGameRequest,
  StartGameResponse,
} from '../shared/types';
import {
  MAX_PLAYERS,
  MAX_PLAYER_NAME_LENGTH,
  MIN_PLAYERS,
  maxImpostors,
} from '../shared/types';
import { DEFAULT_LOCALE, defaultPlayerName, isLocale, type Locale } from '../shared/i18n';
import type { AppContext } from './types';
import { getSessionUser } from './session';

function parseLocale(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export const apiRoutes = new Hono<AppContext>();

// Public: which login providers are configured (drives the login screen).
apiRoutes.get('/providers', (c) => {
  const providers: Providers = {
    google: Boolean(c.env.GOOGLE_CLIENT_ID && c.env.GOOGLE_CLIENT_SECRET),
    apple: Boolean(
      c.env.APPLE_CLIENT_ID && c.env.APPLE_TEAM_ID && c.env.APPLE_KEY_ID && c.env.APPLE_PRIVATE_KEY,
    ),
    dev: c.env.DEV_AUTH === 'true',
  };
  return c.json(providers);
});

apiRoutes.get('/me', async (c) => {
  const user = await getSessionUser(c);
  if (!user) return c.json({ user: null });
  return c.json({ user });
});

// Everything below requires a session.
apiRoutes.use('*', async (c, next) => {
  const user = await getSessionUser(c);
  if (!user) return c.json({ error: 'unauthorized' }, 401);
  c.set('user', user);
  await next();
});

apiRoutes.get('/categories', async (c) => {
  const locale = parseLocale(c.req.query('locale'));
  const { results } = await c.env.DB.prepare(
    `SELECT c.id, c.slug, c.emoji,
            COALESCE(t.name, tf.name, c.slug) AS name,
            COUNT(w.id) AS wordCount
     FROM categories c
     LEFT JOIN category_translations t ON t.category_id = c.id AND t.locale = ?1
     LEFT JOIN category_translations tf ON tf.category_id = c.id AND tf.locale = ?2
     LEFT JOIN words w ON w.category_id = c.id
     GROUP BY c.id ORDER BY name`,
  )
    .bind(locale, DEFAULT_LOCALE)
    .all<Category>();
  return c.json({ categories: results });
});

// ---------------------------------------------------------------------------
// Player roster (saved per account, reused across games)
// ---------------------------------------------------------------------------

const listPlayers = (db: D1Database, userId: number) =>
  db
    .prepare('SELECT id, name FROM players WHERE user_id = ?1 ORDER BY id')
    .bind(userId)
    .all<Player>();

apiRoutes.get('/players', async (c) => {
  const user = c.get('user');
  let { results } = await listPlayers(c.env.DB, user.id);

  if (results.length === 0) {
    // First time only: seed 3 default players in the caller's language. If the
    // user later empties their roster on purpose, we don't seed again. The
    // seeded-flag check lives inside each INSERT and the batch runs as a
    // single transaction, so concurrent first fetches can't double-seed.
    const locale = parseLocale(c.req.query('locale'));
    const seedInsert = c.env.DB.prepare(
      `INSERT INTO players (user_id, name)
       SELECT ?1, ?2 WHERE (SELECT players_seeded FROM users WHERE id = ?1) = 0`,
    );
    await c.env.DB.batch([
      seedInsert.bind(user.id, defaultPlayerName(locale, 1)),
      seedInsert.bind(user.id, defaultPlayerName(locale, 2)),
      seedInsert.bind(user.id, defaultPlayerName(locale, 3)),
      c.env.DB.prepare('UPDATE users SET players_seeded = 1 WHERE id = ?1').bind(user.id),
    ]);
    ({ results } = await listPlayers(c.env.DB, user.id));
  }

  return c.json({ players: results });
});

apiRoutes.post('/players', async (c) => {
  const user = c.get('user');
  let body: { name?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'invalid JSON body' }, 400);
  }
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (name.length === 0 || name.length > MAX_PLAYER_NAME_LENGTH) {
    return c.json({ error: `name must be 1-${MAX_PLAYER_NAME_LENGTH} characters` }, 400);
  }

  const count = await c.env.DB.prepare('SELECT COUNT(*) AS n FROM players WHERE user_id = ?1')
    .bind(user.id)
    .first<{ n: number }>();
  if ((count?.n ?? 0) >= MAX_PLAYERS) {
    return c.json({ error: `a roster can have at most ${MAX_PLAYERS} players` }, 400);
  }

  const player = await c.env.DB.prepare(
    'INSERT INTO players (user_id, name) VALUES (?1, ?2) RETURNING id, name',
  )
    .bind(user.id, name)
    .first<Player>();
  return c.json({ player });
});

apiRoutes.delete('/players/:id', async (c) => {
  const user = c.get('user');
  const id = Number(c.req.param('id'));
  if (!Number.isInteger(id)) return c.json({ error: 'invalid player id' }, 400);
  await c.env.DB.prepare('DELETE FROM players WHERE id = ?1 AND user_id = ?2')
    .bind(id, user.id)
    .run();
  return c.json({ ok: true });
});

apiRoutes.post('/game/start', async (c) => {
  let body: StartGameRequest;
  try {
    body = await c.req.json<StartGameRequest>();
  } catch {
    return c.json({ error: 'invalid JSON body' }, 400);
  }

  const { categoryIds, playerCount, impostorCount } = body;
  if (
    !Array.isArray(categoryIds) ||
    categoryIds.length === 0 ||
    categoryIds.length > 100 ||
    !categoryIds.every((id) => Number.isInteger(id))
  ) {
    return c.json({ error: 'categoryIds must be a non-empty array of category ids' }, 400);
  }
  if (!Number.isInteger(playerCount) || playerCount < MIN_PLAYERS || playerCount > MAX_PLAYERS) {
    return c.json({ error: `playerCount must be between ${MIN_PLAYERS} and ${MAX_PLAYERS}` }, 400);
  }
  if (!Number.isInteger(impostorCount) || impostorCount < 1 || impostorCount > maxImpostors(playerCount)) {
    return c.json(
      { error: `impostorCount must be between 1 and ${maxImpostors(playerCount)} for ${playerCount} players` },
      400,
    );
  }

  const locale = parseLocale(body.locale);
  const user = c.get('user');
  // ?1 = locale, ?2 = default locale, ?3+ = category ids, last = user id.
  const placeholders = categoryIds.map((_, i) => `?${i + 3}`).join(', ');
  const userParam = `?${categoryIds.length + 3}`;

  const pickWord = () =>
    c.env.DB.prepare(
      `SELECT w.id AS wordId,
              COALESCE(t.word, tf.word) AS word,
              COALESCE(t.impostor_hint, tf.impostor_hint) AS hint,
              COALESCE(ct.name, ctf.name, c.slug) AS category
       FROM words w
       JOIN categories c ON c.id = w.category_id
       LEFT JOIN word_translations t ON t.word_id = w.id AND t.locale = ?1
       LEFT JOIN word_translations tf ON tf.word_id = w.id AND tf.locale = ?2
       LEFT JOIN category_translations ct ON ct.category_id = c.id AND ct.locale = ?1
       LEFT JOIN category_translations ctf ON ctf.category_id = c.id AND ctf.locale = ?2
       WHERE w.category_id IN (${placeholders})
         AND COALESCE(t.word, tf.word) IS NOT NULL
         AND w.id NOT IN (SELECT word_id FROM played_words WHERE user_id = ${userParam})
       ORDER BY RANDOM() LIMIT 1`,
    )
      .bind(locale, DEFAULT_LOCALE, ...categoryIds, user.id)
      .first<GameRound & { wordId: number }>();

  let poolReset = false;
  let row = await pickWord();
  if (!row) {
    // The user has played every word in these categories: clear their history
    // for these categories only and start the pool over.
    const idPlaceholders = categoryIds.map((_, i) => `?${i + 2}`).join(', ');
    await c.env.DB.prepare(
      `DELETE FROM played_words WHERE user_id = ?1
       AND word_id IN (SELECT id FROM words WHERE category_id IN (${idPlaceholders}))`,
    )
      .bind(user.id, ...categoryIds)
      .run();
    poolReset = true;
    row = await pickWord();
  }

  if (!row) return c.json({ error: 'no words found for the selected categories' }, 404);

  try {
    await c.env.DB.prepare(
      'INSERT OR IGNORE INTO played_words (user_id, word_id) VALUES (?1, ?2)',
    )
      .bind(user.id, row.wordId)
      .run();
  } catch {
    // A stale session for a deleted user must not break the round.
  }

  const { word, hint, category } = row;
  const response: StartGameResponse = { round: { word, hint, category }, poolReset };
  return c.json(response);
});
