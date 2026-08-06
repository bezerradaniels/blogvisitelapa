import assert from 'node:assert/strict';
import test from 'node:test';
import { safeInternalRedirect } from './redirect.ts';

test('preserva caminhos internos e seus parâmetros', () => {
  assert.equal(safeInternalRedirect('/busca?q=lapa'), '/busca?q=lapa');
});

test('rejeita destinos externos e caminhos relativos', () => {
  assert.equal(safeInternalRedirect('https://example.com'), '/');
  assert.equal(safeInternalRedirect('//example.com'), '/');
  assert.equal(safeInternalRedirect('perfil'), '/');
});

test('usa o fallback informado quando o destino está ausente', () => {
  assert.equal(safeInternalRedirect(null, '/rede'), '/rede');
});
