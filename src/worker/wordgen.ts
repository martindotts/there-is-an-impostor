import type { Env } from './types';

/**
 * Background word-pool top-up. After every game start we check, per category,
 * how many words the user has NOT played yet. Any category down to
 * TOP_UP_THRESHOLD or fewer gets WORDS_PER_TOP_UP fresh AI-generated words
 * (EN + ES, single-word non-obvious hints) inserted into the global pool.
 * Runs via ctx.waitUntil() after the response; all failures are silent.
 */

const TOP_UP_THRESHOLD = 2;
const WORDS_PER_TOP_UP = 10;
const MAX_WORD_LENGTH = 40;
const MAX_HINT_LENGTH = 25;

interface LocalizedEntry {
  word: string;
  hint: string;
}

interface GeneratedEntry {
  en: LocalizedEntry;
  es: LocalizedEntry;
}

interface DepletedCategory {
  id: number;
  nameEn: string;
  nameEs: string;
  totalWords: number;
}

export async function topUpDepletedCategories(env: Env, userId: number): Promise<void> {
  try {
    const { results } = await env.DB.prepare(
      `SELECT c.id,
              COALESCE(ten.name, c.slug) AS nameEn,
              COALESCE(tes.name, c.slug) AS nameEs,
              COUNT(w.id) AS totalWords,
              SUM(CASE WHEN pw.word_id IS NULL THEN 1 ELSE 0 END) AS unplayed
       FROM categories c
       JOIN words w ON w.category_id = c.id
       LEFT JOIN played_words pw ON pw.word_id = w.id AND pw.user_id = ?1
       LEFT JOIN category_translations ten ON ten.category_id = c.id AND ten.locale = 'en'
       LEFT JOIN category_translations tes ON tes.category_id = c.id AND tes.locale = 'es'
       GROUP BY c.id
       HAVING unplayed <= ?2`,
    )
      .bind(userId, TOP_UP_THRESHOLD)
      .all<DepletedCategory>();

    for (const category of results ?? []) {
      await topUpCategory(env, category);
    }
  } catch (err) {
    console.error('word top-up failed:', err);
  }
}

async function topUpCategory(env: Env, category: DepletedCategory): Promise<void> {
  const { results: existingRows } = await env.DB.prepare(
    `SELECT t.word FROM word_translations t
     JOIN words w ON w.id = t.word_id
     WHERE w.category_id = ?1`,
  )
    .bind(category.id)
    .all<{ word: string }>();
  const existingWords = (existingRows ?? []).map((r) => r.word);
  const seen = new Set(existingWords.map(normalize));

  const entries =
    env.MOCK_AI === 'true'
      ? mockEntries(category)
      : await generateEntries(env, category, existingWords);

  const valid = entries.filter((entry) => isValidEntry(entry, seen));
  if (valid.length === 0) return;

  // Race guard: if a concurrent request already topped this category up, the
  // word count moved since we measured it — drop our batch instead of doubling.
  const count = await env.DB.prepare('SELECT COUNT(*) AS n FROM words WHERE category_id = ?1')
    .bind(category.id)
    .first<{ n: number }>();
  if ((count?.n ?? 0) !== category.totalWords) return;

  const translation = env.DB.prepare(
    'INSERT INTO word_translations (word_id, locale, word, impostor_hint) VALUES (?1, ?2, ?3, ?4)',
  );
  for (const entry of valid) {
    const word = await env.DB.prepare('INSERT INTO words (category_id) VALUES (?1) RETURNING id')
      .bind(category.id)
      .first<{ id: number }>();
    if (!word) continue;
    await env.DB.batch([
      translation.bind(word.id, 'en', entry.en.word, entry.en.hint),
      translation.bind(word.id, 'es', entry.es.word, entry.es.hint),
    ]);
  }
}

// ---------------------------------------------------------------------------
// Generation
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You generate words for a social deduction party game ("The Impostor").
Regular players see a secret word; impostors only see a one-word hint and must blend into the
conversation without knowing the word. Your job is to invent secret words with hints that help
an impostor improvise WITHOUT giving the word away.

Rules for secret words:
- Common, concrete, widely known things that clearly belong to the given category.
- Short: one to three words. Proper nouns are fine where natural (movies, etc.).
- Never repeat anything from the provided existing list, in either language.

Rules for hints (CRITICAL):
- Exactly ONE word.
- Laterally related, never obvious. A hint is TOO OBVIOUS if it is: a synonym of the word, the
  category name, contained in the word, or the single most common association.
- Good examples: Pizza -> "Slices"/"Porciones"; Firefighter -> "Sirens"/"Sirenas";
  Library -> "Silence"/"Silencio"; Umbrella -> "Foldable"/"Plegable".
- Bad examples: Pizza -> "Food"/"Comida"; Firefighter -> "Fire"/"Fuego";
  Library -> "Books"/"Libros"; Umbrella -> "Rain"/"Lluvia".

Spanish must be neutral Latin American Spanish. The English and Spanish entries must refer to
the same concept (translations of each other), each with a hint that works in its language.

Respond ONLY with JSON, no prose, in this exact shape:
{"entries":[{"en":{"word":"...","hint":"..."},"es":{"word":"...","hint":"..."}}, ...]}`;

async function generateEntries(
  env: Env,
  category: DepletedCategory,
  existingWords: string[],
): Promise<GeneratedEntry[]> {
  const userPrompt = `Category: "${category.nameEn}" (Spanish: "${category.nameEs}").
Existing words you must NOT repeat: ${existingWords.join(', ') || '(none)'}.
Generate exactly ${WORDS_PER_TOP_UP} new entries.`;

  try {
    const result = (await env.AI.run(env.AI_MODEL, {
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 2000,
      temperature: 0.8,
      response_format: {
        type: 'json_schema',
        json_schema: {
          type: 'object',
          properties: {
            entries: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  en: localizedSchema(),
                  es: localizedSchema(),
                },
                required: ['en', 'es'],
              },
            },
          },
          required: ['entries'],
        },
      },
    })) as { response?: unknown };

    let payload: unknown = result?.response ?? result;
    if (typeof payload === 'string') payload = extractJson(payload);
    const entries = (payload as { entries?: unknown })?.entries;
    return Array.isArray(entries) ? (entries.slice(0, WORDS_PER_TOP_UP) as GeneratedEntry[]) : [];
  } catch (err) {
    console.error(`word generation failed for category ${category.id}:`, err);
    return [];
  }
}

function localizedSchema() {
  return {
    type: 'object',
    properties: {
      word: { type: 'string' },
      hint: { type: 'string' },
    },
    required: ['word', 'hint'],
  };
}

function extractJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end <= start) return null;
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

// Deterministic fake entries for local development (MOCK_AI=true).
function mockEntries(category: DepletedCategory): GeneratedEntry[] {
  return Array.from({ length: WORDS_PER_TOP_UP }, (_, i) => {
    const n = category.totalWords + i + 1;
    return {
      en: { word: `Mock ${category.nameEn} ${n}`, hint: 'Placeholder' },
      es: { word: `Simulada ${category.nameEs} ${n}`, hint: 'Relleno' },
    };
  });
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

function isValidLocalized(entry: LocalizedEntry): boolean {
  entry.word = entry.word.trim();
  entry.hint = entry.hint.trim();
  if (!entry.word || entry.word.length > MAX_WORD_LENGTH) return false;
  if (!entry.hint || entry.hint.length > MAX_HINT_LENGTH) return false;
  // The hint must be a single, non-revealing word.
  if (entry.hint.split(/\s+/).length !== 1) return false;
  const word = normalize(entry.word);
  const hint = normalize(entry.hint);
  if (!word || !hint) return false;
  if (word.includes(hint) || hint.includes(word)) return false;
  return true;
}

/** Validates one entry and reserves its words in `seen` to dedupe the batch. */
function isValidEntry(entry: GeneratedEntry, seen: Set<string>): boolean {
  if (
    typeof entry?.en?.word !== 'string' ||
    typeof entry.en.hint !== 'string' ||
    typeof entry?.es?.word !== 'string' ||
    typeof entry.es.hint !== 'string'
  ) {
    return false;
  }
  if (!isValidLocalized(entry.en) || !isValidLocalized(entry.es)) return false;

  const keys = [normalize(entry.en.word), normalize(entry.es.word)];
  if (keys.some((key) => seen.has(key))) return false;
  for (const key of keys) seen.add(key);
  return true;
}
