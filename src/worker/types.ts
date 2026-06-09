export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  SESSION_SECRET: string;
  DEV_AUTH?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  APPLE_CLIENT_ID?: string;
  APPLE_TEAM_ID?: string;
  APPLE_KEY_ID?: string;
  APPLE_PRIVATE_KEY?: string;
}

export interface UserRow {
  id: number;
  provider: string;
  provider_id: string;
  email: string | null;
  name: string | null;
}

export type AppContext = {
  Bindings: Env;
  Variables: {
    user: import('../shared/types').SessionUser;
  };
};
