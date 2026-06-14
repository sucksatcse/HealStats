import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { authMiddleware } from './middleware/auth';
import type { Env } from './env';
import { authRouter } from './routes/auth';
import { dashboardRouter } from './routes/dashboard';
import { encountersRouter } from './routes/encounters';
import { patientsRouter } from './routes/patients';
import { prescriptionsRouter } from './routes/prescriptions';
import { syncRouter } from './routes/sync';

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors());
app.use('*', logger());
app.get('/health', (c) => c.json({ ok: true, service: 'healthstats-backend' }));
app.use('/api/*', authMiddleware);

app.route('/api/auth', authRouter);
app.route('/api/patients', patientsRouter);
app.route('/api/encounters', encountersRouter);
app.route('/api/prescriptions', prescriptionsRouter);
app.route('/api/dashboard', dashboardRouter);
app.route('/api/sync', syncRouter);

app.notFound((c) => c.json({ error: 'Not Found' }, 404));
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: 'Internal Server Error' }, 500);
});

export default app;