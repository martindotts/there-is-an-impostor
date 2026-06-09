import { Hono } from 'hono';
import type {
  Category,
  GameRound,
  Providers,
  StartGameRequest,
} from '../shared/types';
import { MAX_PLAYERS, MIN_PLAYERS, maxImpostors } from '../shared/types';
import { DEFAULT_LOCALE, isLocale, type Locale } from '../shared/i18n';
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
  // ?1 = locale, ?2 = default locale, ?3+ = category ids.
  const placeholders = categoryIds.map((_, i) => `?${i + 3}`).join(', ');
  const row = await c.env.DB.prepare(
    `SELECT COALESCE(t.word, tf.word) AS word,
            COALESCE(t.impostor_hint, tf.impostor_hint) AS hint,
            COALESCE(ct.name, ctf.name, c.slug) AS category
     FROM words w
     JOIN categories c ON c.id = w.category_id
     LEFT JOIN word_translations t ON t.word_id = w.id AND t.locale = ?1
     LEFT JOIN word_translations tf ON tf.word_id = w.id AND tf.locale = ?2
     LEFT JOIN category_translations ct ON ct.category_id = c.id AND ct.locale = ?1
     LEFT JOIN category_translations ctf ON ctf.category_id = c.id AND ctf.locale = ?2
     WHERE w.category_id IN (${placeholders}) AND COALESCE(t.word, tf.word) IS NOT NULL
     ORDER BY RANDOM() LIMIT 1`,
  )
    .bind(locale, DEFAULT_LOCALE, ...categoryIds)
    .first<GameRound>();

  if (!row) return c.json({ error: 'no words found for the selected categories' }, 404);
  return c.json({ round: row });
});
