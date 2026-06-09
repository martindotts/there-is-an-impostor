-- Saved player roster per account. Seeded with 3 default players (localized:
-- "Player 1" / "Jugador 1") the first time the user fetches it; after that the
-- roster is whatever the user curated, even if they delete everyone.
ALTER TABLE users ADD COLUMN players_seeded INTEGER NOT NULL DEFAULT 0;

CREATE TABLE players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_players_user ON players(user_id);
