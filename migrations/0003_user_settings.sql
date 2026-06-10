-- Per-user preferences. `locale` is null until the user first signs in (the
-- client then adopts the device language); the booleans control what
-- impostors get to see during a round.
ALTER TABLE users ADD COLUMN locale TEXT;
ALTER TABLE users ADD COLUMN show_hint INTEGER NOT NULL DEFAULT 1;
ALTER TABLE users ADD COLUMN show_category INTEGER NOT NULL DEFAULT 1;
