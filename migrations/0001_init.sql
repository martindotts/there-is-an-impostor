-- Users authenticated via Google / Apple (or the local dev provider).
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  email TEXT,
  name TEXT,
  -- Profile picture URL from the OAuth provider (Google sends one; Apple does
  -- not, so the UI falls back to a default avatar).
  picture TEXT,
  -- Whether the default player roster was already seeded once for this user.
  players_seeded INTEGER NOT NULL DEFAULT 0,
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
  -- A single, deliberately non-obvious word shown to impostors instead of the
  -- secret word.
  impostor_hint TEXT NOT NULL,
  PRIMARY KEY (word_id, locale)
);

-- Words a user has already played, so rounds never repeat a word for the same
-- user (tracked by language-neutral word id). When a user exhausts every word
-- in the selected categories, their history for those categories is cleared
-- and the pool starts over.
CREATE TABLE played_words (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word_id INTEGER NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  played_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, word_id)
);

-- Saved player roster per account, edited before each game and reused.
CREATE TABLE players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_words_category ON words(category_id);
CREATE INDEX idx_word_translations_locale ON word_translations(locale);
CREATE INDEX idx_players_user ON players(user_id);
