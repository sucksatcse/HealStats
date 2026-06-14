import { createMiddleware } from 'hono/factory';
import { jwt } from 'hono/jwt';
import type { Env } from '../env';

export const authMiddleware = createMiddleware<{ Bindings: Env }>(async (c, next) => {
  if (c.req.path.startsWith('/api/auth')) {
    await next();
    return;
  }

  const secret = c.env.JWT_SECRET ?? 'healthstats-dev-secret';
  const middleware = jwt({ secret });
  await middleware(c, next);
});