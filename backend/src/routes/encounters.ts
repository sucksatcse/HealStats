import { Hono } from 'hono';
import type { Env } from '../env';

export const encountersRouter = new Hono<{ Bindings: Env }>()
  .get('/', (c) => c.json({ data: [] }))
  .post('/', async (c) => {
    const encounter = await c.req.json();
    return c.json({ data: encounter }, 201);
  });