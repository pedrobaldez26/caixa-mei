import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createApp } from './app.ts';
import { openDb } from './db.ts';

const port = Number(process.env.PORT ?? 3001);
const dbPath = process.env.DB_PATH ?? './data/caixa.db';

let jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  if (process.env.NODE_ENV === 'production') {
    console.error('JWT_SECRET é obrigatório em produção');
    process.exit(1);
  }
  jwtSecret = 'dev-only-secret';
  console.warn('JWT_SECRET não definido, usando segredo de desenvolvimento');
}

mkdirSync(dirname(dbPath), { recursive: true });
const app = createApp(openDb(dbPath), { jwtSecret });

// Se o front já foi buildado (npm run build), serve tudo junto na mesma porta.
const webDist = fileURLToPath(new URL('../../web/dist', import.meta.url));
if (existsSync(webDist)) {
  app.use(express.static(webDist));
  app.get('/{*splat}', (_req, res) => res.sendFile(join(webDist, 'index.html')));
}

app.listen(port, () => {
  console.log(`API rodando em http://localhost:${port}`);
});
