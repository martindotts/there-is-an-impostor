-- Words a user has already played, so rounds never repeat a word for the same
-- user. Tracked by language-neutral word id: seeing "Pizza" in Spanish also
-- excludes it in English. When a user exhausts every word in the selected
-- categories, their history for those categories is cleared and the pool
-- starts over.
CREATE TABLE played_words (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word_id INTEGER NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  played_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, word_id)
);
