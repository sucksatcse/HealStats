import { Hono } from 'hono';
import type { Env } from '../env';

export const prescriptionsRouter = new Hono<{ Bindings: Env }>()
  .get('/', (c) => c.json({ data: [] }))
  .post('/', async (c) => {
    const prescription = await c.req.json();
    return c.json({ data: prescription }, 201);
  });