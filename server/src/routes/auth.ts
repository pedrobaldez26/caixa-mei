import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import type { Db } from '../db.ts';
import { signToken } from '../auth.ts';

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().max(120).transform((v) => v.toLowerCase()),
  password: z.string().min(8).max(72), // bcrypt ignora o que passa de 72 bytes
});

const loginSchema = z.object({
  email: z.email().transform((v) => v.toLowerCase()),
  password: z.string().min(1),
});

interface UserRow {
  id: number;
  name: string;
  email: string;
  password_hash: string;
}

export function authRouter(db: Db, secret: string) {
  const router = Router();

  router.post('/register', async (req, res) => {
    const data = registerSchema.parse(req.body);

    const exists = db.prepare('SELECT 1 FROM users WHERE email = ?').get(data.email);
    if (exists) {
      res.status(409).json({ error: 'email_taken' });
      return;
    }

    const hash = await bcrypt.hash(data.password, 10);
    const result = db
      .prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
      .run(data.name, data.email, hash);

    const id = Number(result.lastInsertRowid);
    res.status(201).json({
      token: signToken(id, secret),
      user: { id, name: data.name, email: data.email },
    });
  });

  router.post('/login', async (req, res) => {
    const data = loginSchema.parse(req.body);
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(data.email) as
      | UserRow
      | undefined;

    // mesma resposta para email inexistente e senha errada
    const ok = user ? await bcrypt.compare(data.password, user.password_hash) : false;
    if (!user || !ok) {
      res.status(401).json({ error: 'invalid_credentials' });
      return;
    }

    res.json({
      token: signToken(user.id, secret),
      user: { id: user.id, name: user.name, email: user.email },
    });
  });

  return router;
}
