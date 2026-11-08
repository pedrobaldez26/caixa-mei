import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { createApp } from '../src/app.ts';
import { openDb } from '../src/db.ts';

let server: Server;
let base: string;

before(async () => {
  const app = createApp(openDb(), { jwtSecret: 'test-secret' });
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(() => {
  server.close();
});

async function call(path: string, init: RequestInit & { token?: string; json?: unknown } = {}) {
  const headers: Record<string, string> = {};
  if (init.json !== undefined) headers['content-type'] = 'application/json';
  if (init.token) headers.authorization = `Bearer ${init.token}`;
  const res = await fetch(base + path, {
    method: init.method,
    headers,
    body: init.json !== undefined ? JSON.stringify(init.json) : undefined,
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

async function register(email: string) {
  const r = await call('/api/auth/register', {
    method: 'POST',
    json: { name: 'Teste', email, password: 'senha-segura-123' },
  });
  assert.equal(r.status, 201);
  return r.body.token as string;
}

test('cadastro, login e senha errada', async () => {
  await register('ana@exemplo.com');

  const ok = await call('/api/auth/login', {
    method: 'POST',
    json: { email: 'ANA@exemplo.com', password: 'senha-segura-123' },
  });
  assert.equal(ok.status, 200);
  assert.ok(ok.body.token);

  const bad = await call('/api/auth/login', {
    method: 'POST',
    json: { email: 'ana@exemplo.com', password: 'outra-senha' },
  });
  assert.equal(bad.status, 401);

  const dup = await call('/api/auth/register', {
    method: 'POST',
    json: { name: 'Ana', email: 'ana@exemplo.com', password: 'senha-segura-123' },
  });
  assert.equal(dup.status, 409);
});

test('rotas protegidas exigem token', async () => {
  assert.equal((await call('/api/entries')).status, 401);
  assert.equal((await call('/api/summary', { token: 'lixo' })).status, 401);
});

test('valida o corpo do lançamento', async () => {
  const token = await register('val@exemplo.com');
  const r = await call('/api/entries', {
    method: 'POST',
    token,
    json: { kind: 'income', description: '', category: 'Serviços', amountCents: -5, date: '2026-13-40' },
  });
  assert.equal(r.status, 400);
  assert.equal(r.body.error, 'validation_error');
});

test('cada usuário só enxerga e apaga os próprios lançamentos', async () => {
  const a = await register('a@exemplo.com');
  const b = await register('b@exemplo.com');

  const created = await call('/api/entries', {
    method: 'POST',
    token: a,
    json: { kind: 'income', description: 'Site institucional', category: 'Serviços', amountCents: 250_000, date: '2026-02-10' },
  });
  assert.equal(created.status, 201);

  const listB = await call('/api/entries?month=2026-02', { token: b });
  assert.deepEqual(listB.body, []);

  const delB = await call(`/api/entries/${created.body.id}`, { method: 'DELETE', token: b });
  assert.equal(delB.status, 404);

  const listA = await call('/api/entries?month=2026-02', { token: a });
  assert.equal(listA.body.length, 1);

  const delA = await call(`/api/entries/${created.body.id}`, { method: 'DELETE', token: a });
  assert.equal(delA.status, 204);
});

test('resumo anual acompanha o limite do MEI', async () => {
  const token = await register('mei@exemplo.com');
  for (const [date, cents] of [
    ['2026-01-15', 4_000_000],
    ['2026-02-15', 4_500_000],
  ] as const) {
    await call('/api/entries', {
      method: 'POST',
      token,
      json: { kind: 'income', description: 'Projeto', category: 'Serviços', amountCents: cents, date },
    });
  }
  await call('/api/entries', {
    method: 'POST',
    token,
    json: { kind: 'expense', description: 'Hospedagem', category: 'Infra', amountCents: 20_000, date: '2026-02-20' },
  });

  const r = await call('/api/summary?year=2026', { token });
  assert.equal(r.status, 200);
  assert.equal(r.body.totalIncome, 8_500_000);
  assert.equal(r.body.limit.status, 'over');
  assert.equal(r.body.limit.remainingCents, 0);
  assert.equal(r.body.balance, 8_480_000);
});

test('JSON quebrado devolve 400', async () => {
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{ nao é json',
  });
  assert.equal(res.status, 400);
});
