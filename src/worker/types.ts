// Minimal interface for the Workers AI binding: the official `Ai` type keys
// `run()` by a fixed model catalog, which fights a model name driven by config.
export interface AiBinding {
  run(model: string, options: Record<string, unknown>): Promise<unknown>;
}

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  AI: AiBinding;
  AI_MODEL: string;
  MOCK_AI?: string;
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
  picture: string | null;
}

export type AppContext = {
  Bindings: Env;
  Variables: {
    user: import('../shared/types').SessionUser;
  };
};
