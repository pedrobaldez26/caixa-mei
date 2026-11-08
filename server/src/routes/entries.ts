import { Router } from 'express';
import { z } from 'zod';
import type { Db } from '../db.ts';

const entrySchema = z.object({
  kind: z.enum(['income', 'expense']),
  description: z.string().trim().min(1).max(120),
  category: z.string().trim().min(1).max(40),
  amountCents: z.number().int().positive().max(1_000_000_000),
  date: z.iso.date(),
});

const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);

interface EntryRow {
  id: number;
  kind: string;
  description: string;
  category: string;
  amount_cents: number;
  date: string;
}

function toDto(row: EntryRow) {
  return {
    id: row.id,
    kind: row.kind,
    description: row.description,
    category: row.category,
    amountCents: row.amount_cents,
    date: row.date,
  };
}

export function entriesRouter(db: Db) {
  const router = Router();

  router.get('/', (req, res) => {
    const userId = res.locals.userId as number;
    const month = req.query.month === undefined ? undefined : monthSchema.parse(req.query.month);

    const rows = (
      month
        ? db
            .prepare(
              `SELECT * FROM entries WHERE user_id = ? AND substr(date, 1, 7) = ?
               ORDER BY date DESC, id DESC`,
            )
            .all(userId, month)
        : db.prepare('SELECT * FROM entries WHERE user_id = ? ORDER BY date DESC, id DESC').all(userId)
    ) as unknown as EntryRow[];

    res.json(rows.map(toDto));
  });

  router.post('/', (req, res) => {
    const userId = res.locals.userId as number;
    const e = entrySchema.parse(req.body);

    const result = db
      .prepare(
        `INSERT INTO entries (user_id, kind, description, category, amount_cents, date)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(userId, e.kind, e.description, e.category, e.amountCents, e.date);

    res.status(201).json({ id: Number(result.lastInsertRowid), ...e });
  });

  router.delete('/:id', (req, res) => {
    const userId = res.locals.userId as number;
    const id = Number(req.params.id);

    const result = db.prepare('DELETE FROM entries WHERE id = ? AND user_id = ?').run(id, userId);
    if (result.changes === 0) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    res.status(204).end();
  });

  return router;
}
