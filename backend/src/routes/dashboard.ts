import { Hono } from 'hono';
import type { Env } from '../env';

export const dashboardRouter = new Hono<{ Bindings: Env }>().get('/', (c) => {
  return c.json({
    summary: {
      patients: 0,
      encounters: 0,
      pendingSync: 0
    }
  });
});