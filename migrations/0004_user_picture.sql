-- Profile picture URL from the OAuth provider (Google sends one; Apple does
-- not, so the UI falls back to a default avatar).
ALTER TABLE users ADD COLUMN picture TEXT;
