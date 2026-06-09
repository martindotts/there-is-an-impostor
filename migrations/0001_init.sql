-- Users authenticated via Google / Apple (or the local dev provider).
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  email TEXT,
  name TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (provider, provider_id)
);

-- Language-neutral entities; all display text lives in *_translations tables
-- keyed by locale, so adding a language is just adding rows.

CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  emoji TEXT NOT NULL DEFAULT ''
);

CREATE TABLE category_translations (
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  name TEXT NOT NULL,
  PRIMARY KEY (category_id, locale)
);

-- The word pool. Hints are only ever sent to the client as part of an active
-- round; the pool itself is not browsable by users.
CREATE TABLE words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE word_translations (
  word_id INTEGER NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  word TEXT NOT NULL,
  impostor_hint TEXT NOT NULL,
  PRIMARY KEY (word_id, locale)
);

CREATE INDEX idx_words_category ON words(category_id);
CREATE INDEX idx_word_translations_locale ON word_translations(locale);
