import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import type { Db } from './db.ts';
import { requireAuth } from './auth.ts';
import { authRouter } from './routes/auth.ts';
import { entriesRouter } from './routes/entries.ts';
import { summaryRouter } from './routes/summary.ts';

export function createApp(db: Db, opts: { jwtSecret: string }) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '50kb' }));

  const guard = requireAuth(opts.jwtSecret);
  app.use('/api/auth', authRouter(db, opts.jwtSecret));
  app.use('/api/entries', guard, entriesRouter(db));
  app.use('/api/summary', guard, summaryRouter(db));

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'not_found' });
  });

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof ZodError) {
      res.status(400).json({
        error: 'validation_error',
        details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      });
      return;
    }
    // body-parser devolve SyntaxError com status 400 quando o JSON vem quebrado
    if (err instanceof SyntaxError && 'status' in err && err.status === 400) {
      res.status(400).json({ error: 'invalid_json' });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
  });

  return app;
}
