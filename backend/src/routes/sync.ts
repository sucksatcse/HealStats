import { Hono } from 'hono';
import type { Env } from '../env';

export const syncRouter = new Hono<{ Bindings: Env }>()
  .post('/', async (c) => {
    const payload = await c.req.json();
    return c.json({ ok: true, received: payload });
  })
  .get('/', (c) => c.json({ ok: true }));