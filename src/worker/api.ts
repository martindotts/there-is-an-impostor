import { Hono } from 'hono';
import type {
  Category,
  GameRound,
  Providers,
  StartGameRequest,
} from '../shared/types';
import { MAX_PLAYERS, MIN_PLAYERS, maxImpostors } from '../shared/types';
import type { AppContext } from './types';
import { getSessionUser } from './session';

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
  const { results } = await c.env.DB.prepare(
    `SELECT c.id, c.slug, c.name, c.emoji, COUNT(w.id) AS wordCount
     FROM categories c LEFT JOIN words w ON w.category_id = c.id
     GROUP BY c.id ORDER BY c.name`,
  ).all<Category>();
  return c.json({ categories: results });
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

  const placeholders = categoryIds.map((_, i) => `?${i + 1}`).join(', ');
  const row = await c.env.DB.prepare(
    `SELECT w.word, w.impostor_hint AS hint, c.name AS category
     FROM words w JOIN categories c ON c.id = w.category_id
     WHERE w.category_id IN (${placeholders})
     ORDER BY RANDOM() LIMIT 1`,
  )
    .bind(...categoryIds)
    .first<GameRound>();

  if (!row) return c.json({ error: 'no words found for the selected categories' }, 404);
  return c.json({ round: row });
});
