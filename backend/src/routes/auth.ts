import { Hono } from 'hono';
import type { Env } from '../env';

export const authRouter = new Hono<{ Bindings: Env }>()
  .post('/login', async (c) => {
    const body = await c.req.json<{ username?: string; password?: string; role?: string }>();

    return c.json({
      token: 'demo-jwt-token',
      user: {
        id: 'demo-user',
        name: body.username ?? 'Demo User',
        role: body.role ?? 'doctor',
        facilityId: 'demo-facility'
      }
    });
  })
  .get('/me', (c) => {
    return c.json({ ok: true });
  });