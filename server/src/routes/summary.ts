import { Router } from 'express';
import { z } from 'zod';
import type { Db } from '../db.ts';
import { computeSummary, type EntryRow } from '../summary.ts';

const yearSchema = z.coerce.number().int().min(2000).max(2100);

export function summaryRouter(db: Db) {
  const router = Router();

  router.get('/', (req, res) => {
    const userId = res.locals.userId as number;
    const year = req.query.year === undefined ? new Date().getFullYear() : yearSchema.parse(req.query.year);

    const rows = db
      .prepare(
        `SELECT kind, amount_cents, date FROM entries
         WHERE user_id = ? AND substr(date, 1, 4) = ?`,
      )
      .all(userId, String(year)) as unknown as EntryRow[];

    res.json(computeSummary(rows, year));
  });

  return router;
}
