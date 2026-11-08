import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseBRL } from '../src/money.ts';

test('parseBRL entende formatos comuns', () => {
  assert.equal(parseBRL('1.234,56'), 123_456);
  assert.equal(parseBRL('1234,5'), 123_450);
  assert.equal(parseBRL('1234.56'), 123_456);
  assert.equal(parseBRL('R$ 50'), 5_000);
  assert.equal(parseBRL('0,99'), 99);
});

test('parseBRL rejeita lixo, zero e negativo', () => {
  assert.equal(parseBRL(''), null);
  assert.equal(parseBRL('abc'), null);
  assert.equal(parseBRL('0'), null);
  assert.equal(parseBRL('-10'), null);
  assert.equal(parseBRL('10,999'), null);
});
