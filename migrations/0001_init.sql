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

CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT ''
);

-- The word pool. `impostor_hint` is only ever sent to the client as part of an
-- active round; the pool itself is not browsable by users.
CREATE TABLE words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  impostor_hint TEXT NOT NULL,
  UNIQUE (category_id, word)
);

CREATE INDEX idx_words_category ON words(category_id);
