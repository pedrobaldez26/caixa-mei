import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeSummary, limitStatus, MEI_ANNUAL_LIMIT_CENTS } from '../src/summary.ts';

test('soma receitas e despesas por mês e ignora outros anos', () => {
  const s = computeSummary(
    [
      { kind: 'income', amount_cents: 150_000, date: '2026-01-10' },
      { kind: 'income', amount_cents: 50_000, date: '2026-01-25' },
      { kind: 'expense', amount_cents: 30_000, date: '2026-01-12' },
      { kind: 'income', amount_cents: 99_999, date: '2025-12-31' },
      { kind: 'expense', amount_cents: 10_000, date: '2026-03-02' },
    ],
    2026,
  );

  assert.equal(s.months[0]?.income, 200_000);
  assert.equal(s.months[0]?.expense, 30_000);
  assert.equal(s.months[2]?.expense, 10_000);
  assert.equal(s.totalIncome, 200_000);
  assert.equal(s.balance, 160_000);
});

test('status do limite nos pontos de corte', () => {
  const L = MEI_ANNUAL_LIMIT_CENTS;
  assert.equal(limitStatus(0), 'ok');
  assert.equal(limitStatus(L * 0.79), 'ok');
  assert.equal(limitStatus(L * 0.8), 'attention');
  assert.equal(limitStatus(L), 'attention');
  assert.equal(limitStatus(L + 1), 'over');
  assert.equal(limitStatus(L * 1.2), 'over');
  assert.equal(limitStatus(L * 1.2 + 1), 'disqualified');
});

test('restante nunca fica negativo', () => {
  const s = computeSummary([{ kind: 'income', amount_cents: 9_000_000, date: '2026-06-01' }], 2026);
  assert.equal(s.limit.remainingCents, 0);
  assert.equal(s.limit.status, 'over');
});
