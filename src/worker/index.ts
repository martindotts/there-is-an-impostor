import { Hono } from 'hono';
import type { AppContext } from './types';
import { authRoutes } from './auth';
import { apiRoutes } from './api';

const app = new Hono<AppContext>();

app.route('/auth', authRoutes);
app.route('/api', apiRoutes);

// Anything else that reached the Worker (run_worker_first only routes /api/*
// and /auth/* here) falls through to the static assets / SPA.
app.notFound((c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
