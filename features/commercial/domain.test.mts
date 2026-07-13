import assert from 'node:assert/strict';
import test from 'node:test';

import {
  calculateContractTotals,
  canTransitionCampaignStatus,
  canTransitionContractStatus,
  canTransitionPaymentStatus,
  centsFromCurrencyDigits,
  createInstallmentSchedule,
  deriveCampaignStatus,
  deriveContractPaymentStatus,
  deriveContractStatus,
  derivePaymentStatus,
  formatBrlCents,
  formatBrlInput,
  parseBrlCents,
  splitCentsIntoInstallments,
  tryParseBrlCents,
  validateDateRange,
} from './domain.ts';

test('formata e interpreta valores em centavos sem perder precisão', () => {
  assert.equal(formatBrlCents(123_456), 'R$ 1.234,56');
  assert.equal(formatBrlInput(123_456), '1.234,56');
  assert.equal(parseBrlCents('R$ 1.234,56'), 123_456);
  assert.equal(parseBrlCents('10.50'), 1_050);
  assert.equal(parseBrlCents(10.5), 1_050);
  assert.equal(centsFromCurrencyDigits('12.345'), 12_345);
  assert.equal(tryParseBrlCents('inválido'), null);
});

test('calcula descontos por item e por contrato na ordem comercial correta', () => {
  const totals = calculateContractTotals({
    items: [
      { id: 'banner', quantity: 2, unitPriceCents: 1_000, discount: { type: 'percentage', percentage: 10 } },
      { id: 'conteudo', quantity: 3, unitPriceCents: 500, discount: { type: 'fixed', amountCents: 200 } },
    ],
    contractDiscount: { type: 'percentage', percentage: 10 },
    additionalCostsCents: 50,
  });

  assert.deepEqual(totals.items.map((item) => item.totalCents), [1_800, 1_300]);
  assert.equal(totals.subtotalCents, 3_100);
  assert.equal(totals.itemDiscountsCents, 400);
  assert.equal(totals.contractDiscountCents, 310);
  assert.equal(totals.totalCents, 2_840);
});

test('distribui centavos de parcelas exatamente e preserva o dia quando possível', () => {
  assert.deepEqual(splitCentsIntoInstallments(1_000, 3), [334, 333, 333]);

  const schedule = createInstallmentSchedule({
    totalCents: 1_000,
    installmentCount: 3,
    firstDueDate: '2026-01-31',
  });

  assert.deepEqual(schedule, [
    { number: 1, amountCents: 334, dueDate: '2026-01-31' },
    { number: 2, amountCents: 333, dueDate: '2026-02-28' },
    { number: 3, amountCents: 333, dueDate: '2026-03-31' },
  ]);
  assert.equal(schedule.reduce((total, installment) => total + installment.amountCents, 0), 1_000);
});

test('deriva estados comerciais sem publicar rascunhos ou ignorar vencimentos', () => {
  const now = new Date('2026-07-12T12:00:00.000Z');

  assert.equal(deriveContractStatus({
    currentStatus: 'aprovado',
    startDate: '2026-07-20',
    endDate: '2026-08-20',
    now,
  }), 'agendado');
  assert.equal(deriveContractStatus({
    currentStatus: 'ativo',
    startDate: '2026-06-01',
    endDate: '2026-07-11',
    now,
  }), 'expirado');
  assert.equal(deriveContractStatus({
    currentStatus: 'rascunho',
    startDate: '2026-06-01',
    endDate: '2026-07-11',
    now,
  }), 'rascunho');

  assert.equal(deriveCampaignStatus({
    currentStatus: 'em_revisao',
    hasMedia: true,
    isApprovedForPublication: true,
    startAt: '2026-07-20T00:00:00.000Z',
    endAt: '2026-08-20T00:00:00.000Z',
    now,
  }), 'agendada');
  assert.equal(deriveCampaignStatus({
    currentStatus: 'agendada',
    hasMedia: false,
    isApprovedForPublication: true,
    startAt: '2026-07-01T00:00:00.000Z',
    endAt: '2026-08-20T00:00:00.000Z',
    now,
  }), 'aguardando_midia');
  assert.deepEqual(validateDateRange('2026-07-20', '2026-07-12'), {
    valid: false,
    message: 'O fim do período não pode ser anterior ao início.',
  });
});

test('deriva recebíveis e consolida o financeiro de contratos', () => {
  const now = new Date('2026-07-12T12:00:00.000Z');

  assert.equal(derivePaymentStatus({ amountCents: 1_000, paidCents: 0, dueDate: '2026-07-11', now }), 'atrasado');
  assert.equal(derivePaymentStatus({ amountCents: 1_000, paidCents: 400, dueDate: '2026-07-20', now }), 'parcial');
  assert.equal(derivePaymentStatus({ amountCents: 1_000, paidCents: 1_000, dueDate: '2026-07-20', now }), 'pago');
  assert.equal(deriveContractPaymentStatus([
    { amountCents: 1_000, paidCents: 1_000, dueDate: '2026-07-01', now },
    { amountCents: 1_000, paidCents: 0, dueDate: '2026-07-11', now },
  ]), 'atrasado');
});

test('expõe transições explicitamente autorizadas para UI e automações', () => {
  assert.equal(canTransitionContractStatus('pendente_aprovacao', 'aprovado'), true);
  assert.equal(canTransitionContractStatus('aprovado', 'expirado'), false);
  assert.equal(canTransitionContractStatus('aprovado', 'expirado', 'automation'), true);
  assert.equal(canTransitionCampaignStatus('agendada', 'ativa', 'automation'), true);
  assert.equal(canTransitionCampaignStatus('cancelada', 'ativa'), false);
  assert.equal(canTransitionPaymentStatus('pendente', 'atrasado'), false);
  assert.equal(canTransitionPaymentStatus('pendente', 'atrasado', 'automation'), true);
});
