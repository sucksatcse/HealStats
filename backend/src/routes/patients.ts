import { Hono } from 'hono';
import type { Env } from '../env';

export const patientsRouter = new Hono<{ Bindings: Env }>()
  .get('/', (c) => c.json({ data: [] }))
  .post('/', async (c) => {
    const patient = await c.req.json();
    return c.json({ data: patient }, 201);
  })
  .get('/:id', (c) => c.json({ data: { id: c.req.param('id') } }));