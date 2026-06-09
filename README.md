# There Is an Impostor 🕵️

A pass-the-phone party game. Everyone gets the secret word — except the impostors, who only get
a vague hint. Take turns describing the word, then vote on who's faking it.

Single repository containing both the backend (Cloudflare Worker, [Hono](https://hono.dev)) and
the frontend (React + Vite SPA served as Worker static assets). Data lives in Cloudflare D1.

## Features

- Sign in with **Google** or **Apple** (only those two; plus an optional local-only dev login).
- Internal **word pool** in D1, each word paired with an impostor hint (users never browse the pool).
- **Category multi-select** when starting a game — all categories selected by default.
- Support for **multiple impostors** (always a strict minority of players).

## How a round works

1. The host signs in, picks categories, player count, and impostor count, and taps **Start game**.
2. The server picks a random word (+ hint) from the selected categories.
3. The phone is passed around: each player privately reveals their word — impostors see the hint
   instead.
4. Discussion: starting with a random player, everyone says one word about the secret word, then
   the group votes. Finally the app reveals the impostors and the word.

## Project layout

```
migrations/          D1 schema + seed words (the word pool)
src/worker/          Hono app: auth (Google/Apple OIDC), session cookies, game API
src/client/          React SPA (login, setup, reveal, discussion, results)
src/shared/          Types shared by both sides
wrangler.jsonc       Worker + D1 + static assets configuration
```

## Local development

```sh
npm install
copy .dev.vars.example .dev.vars        # then edit values
npm run db:migrate:local                 # apply schema + seed to the local D1
npm run dev                              # Vite + Workers runtime on http://localhost:5173
```

With `DEV_AUTH=true` in `.dev.vars` you get a **Dev login** button so you can play locally
without OAuth credentials.

## Deployment (Cloudflare Workers)

1. Create the database and copy its id into `wrangler.jsonc` (`database_id`):

   ```sh
   wrangler d1 create imposter-db
   npm run db:migrate:remote
   ```

2. Set secrets:

   ```sh
   wrangler secret put SESSION_SECRET        # any long random string
   wrangler secret put GOOGLE_CLIENT_ID
   wrangler secret put GOOGLE_CLIENT_SECRET
   wrangler secret put APPLE_CLIENT_ID       # the Services ID
   wrangler secret put APPLE_TEAM_ID
   wrangler secret put APPLE_KEY_ID
   wrangler secret put APPLE_PRIVATE_KEY     # contents of the .p8 file
   ```

   Make sure `DEV_AUTH` stays `"false"` in `wrangler.jsonc` for production.

3. Deploy:

   ```sh
   npm run deploy
   ```

### OAuth provider setup

**Google** — [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → create an
OAuth 2.0 Client ID (Web application) with redirect URI
`https://<your-worker-domain>/auth/google/callback` (and `http://localhost:5173/auth/google/callback`
for local testing).

**Apple** — [Apple Developer](https://developer.apple.com/account) → create an App ID, a
**Services ID** (this is `APPLE_CLIENT_ID`) with Sign in with Apple enabled and return URL
`https://<your-worker-domain>/auth/apple/callback`, and a **Sign in with Apple key** (gives you
`APPLE_KEY_ID` and the `.p8` private key). `APPLE_TEAM_ID` is on your membership page. Apple
requires HTTPS return URLs, so Apple login can't be tested on plain `http://localhost`.

## API

| Route | Description |
| --- | --- |
| `GET /auth/google`, `GET /auth/apple` | Begin OAuth flow |
| `GET /auth/google/callback`, `POST /auth/apple/callback` | OAuth callbacks |
| `POST /auth/logout` | Clear the session |
| `GET /api/providers` | Which login providers are configured |
| `GET /api/me` | Current session user |
| `GET /api/categories` | Categories with word counts (auth required) |
| `POST /api/game/start` | `{ categoryIds, playerCount, impostorCount }` → `{ round: { word, hint, category } }` (auth required) |

## Adding words

Add rows to `words` (with a matching `impostor_hint`) via a new migration in `migrations/`,
then run `npm run db:migrate:remote`. The pool is internal — there is no user-facing endpoint
that lists words.
