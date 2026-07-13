/**
 * Regras de domínio reutilizáveis do módulo comercial.
 *
 * Valores monetários são sempre inteiros em centavos. Isso evita erros de
 * ponto flutuante ao calcular descontos, parcelas e valores recebíveis.
 * Este arquivo não conhece banco, React ou rotas: ele pode ser usado tanto
 * nas actions do servidor quanto nos formulários do cliente.
 */

export type Cents = number;
export type DateInput = Date | string;

export type Discount =
  | { type: 'fixed'; amountCents: Cents }
  | { type: 'percentage'; percentage: number };

export interface ContractItemInput {
  /** Identificador opcional preservado no resultado para facilitar o uso em forms. */
  id?: string;
  quantity: number;
  unitPriceCents: Cents;
  discount?: Discount;
}

export interface CalculatedContractItem extends ContractItemInput {
  grossCents: Cents;
  discountCents: Cents;
  totalCents: Cents;
}

export interface ContractTotalsInput {
  items: readonly ContractItemInput[];
  contractDiscount?: Discount;
  additionalCostsCents?: Cents;
}

export interface ContractTotals {
  items: readonly CalculatedContractItem[];
  subtotalCents: Cents;
  itemDiscountsCents: Cents;
  contractDiscountCents: Cents;
  additionalCostsCents: Cents;
  totalCents: Cents;
}

export interface InstallmentScheduleInput {
  totalCents: Cents;
  installmentCount: number;
  firstDueDate: DateInput;
  /** Intervalo entre as parcelas. O padrão é mensal. */
  intervalMonths?: number;
}

export interface Installment {
  number: number;
  amountCents: Cents;
  /** Data no formato ISO de data (YYYY-MM-DD). */
  dueDate: string;
}

export const CONTRACT_STATUSES = [
  'rascunho',
  'pendente_aprovacao',
  'aprovado',
  'agendado',
  'ativo',
  'pausado',
  'expirado',
  'concluido',
  'removido',
  'cancelado',
] as const;

export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

export const CAMPAIGN_STATUSES = [
  'rascunho',
  'aguardando_midia',
  'em_revisao',
  'agendada',
  'ativa',
  'pausada',
  'expirada',
  'rejeitada',
  'cancelada',
] as const;

export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export const PAYMENT_STATUSES = [
  'pendente',
  'parcial',
  'pago',
  'atrasado',
  'cancelado',
  'estornado',
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export type TransitionActor = 'user' | 'automation';

export interface ContractStatusDerivationInput {
  currentStatus: ContractStatus;
  startDate?: DateInput | null;
  endDate?: DateInput | null;
  now?: Date;
}

export interface CampaignStatusDerivationInput {
  currentStatus: CampaignStatus;
  startAt?: DateInput | null;
  endAt?: DateInput | null;
  hasMedia: boolean;
  /** A aprovação editorial/comercial necessária antes de publicar a campanha. */
  isApprovedForPublication?: boolean;
  /** Uma campanha invisível é operacionalmente tratada como pausada. */
  isVisible?: boolean;
  now?: Date;
}

export interface PaymentStatusDerivationInput {
  amountCents: Cents;
  paidCents?: Cents;
  dueDate?: DateInput | null;
  currentStatus?: PaymentStatus;
  now?: Date;
}

export interface DateRangeValidation {
  valid: boolean;
  message?: string;
}

export interface ValidateDateRangeOptions {
  /** Datas de contrato usam dia; campanhas podem optar por data/hora. */
  precision?: 'date' | 'instant';
  /** Quando falso, informar apenas uma ponta do período torna o intervalo inválido. */
  allowOpenEnded?: boolean;
}

const CENTS_PER_REAL = 100;
const PERCENTAGE_SCALE = 10_000; // 100,00% em pontos-base.
const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function assertFiniteNumber(value: number, field: string): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${field} deve ser um número finito.`);
  }
}

function assertCents(value: number, field: string): void {
  assertFiniteNumber(value, field);
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${field} deve ser um valor inteiro não negativo em centavos.`);
  }
}

function assertPositiveInteger(value: number, field: string): void {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new RangeError(`${field} deve ser um inteiro maior que zero.`);
  }
}

function roundToCents(value: number, field: string): Cents {
  assertFiniteNumber(value, field);
  const rounded = Math.round(value);
  assertCents(rounded, field);
  return rounded;
}

function percentageToBasisPoints(percentage: number): number {
  assertFiniteNumber(percentage, 'O percentual de desconto');
  if (percentage < 0 || percentage > 100) {
    throw new RangeError('O percentual de desconto deve ficar entre 0 e 100.');
  }

  // Duas casas no percentual (ex.: 12,50%) são suficientes para a UI e
  // tornam o arredondamento de centavos determinístico.
  return Math.round(percentage * 100);
}

/** Formata um inteiro de centavos como moeda brasileira (ex.: R$ 1.234,56). */
export function formatBrlCents(cents: Cents): string {
  assertCents(cents, 'O valor');
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / CENTS_PER_REAL);
}

/** Formato apropriado para o conteúdo de um input monetário, sem o símbolo R$. */
export function formatBrlInput(cents: Cents): string {
  assertCents(cents, 'O valor');
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / CENTS_PER_REAL);
}

/**
 * Converte a sequência de dígitos de um input com máscara bancária em centavos.
 * Ex.: "12.345" torna-se 12345 (R$ 123,45). Entrada vazia resulta em zero.
 */
export function centsFromCurrencyDigits(value: string | number): Cents {
  const digits = String(value).replace(/\D/g, '');
  if (!digits) return 0;

  const cents = Number(digits);
  assertCents(cents, 'O valor');
  return cents;
}

/**
 * Converte uma representação brasileira de moeda para centavos.
 *
 * Aceita, por exemplo, "1.234,56", "R$ 10,00", "10.50" e números em reais.
 * Para o comportamento de máscara (cada dígito digitado representa centavos),
 * use `centsFromCurrencyDigits`.
 */
export function parseBrlCents(value: string | number): Cents {
  if (typeof value === 'number') {
    assertFiniteNumber(value, 'O valor');
    if (value < 0) throw new RangeError('O valor não pode ser negativo.');
    return roundToCents(value * CENTS_PER_REAL, 'O valor');
  }

  let normalized = value.trim().replace(/^R\$\s*/i, '');
  if (!normalized) throw new TypeError('Informe um valor em reais.');

  if (normalized.startsWith('+')) normalized = normalized.slice(1);
  if (normalized.startsWith('-')) throw new RangeError('O valor não pode ser negativo.');
  if (!normalized || /[^\d.,\s]/.test(normalized)) {
    throw new TypeError('O valor informado não é uma moeda brasileira válida.');
  }

  normalized = normalized.replace(/\s/g, '');

  let integerPart: string;
  let decimalPart = '';

  if (normalized.includes(',')) {
    const pieces = normalized.split(',');
    if (pieces.length !== 2 || !pieces[0] || !pieces[1] || !/^\d{1,2}$/.test(pieces[1])) {
      throw new TypeError('O valor informado não é uma moeda brasileira válida.');
    }
    if (!/^\d{1,3}(?:\.\d{3})*$/.test(pieces[0]) && !/^\d+$/.test(pieces[0])) {
      throw new TypeError('O valor informado não é uma moeda brasileira válida.');
    }
    integerPart = pieces[0].replace(/\./g, '');
    decimalPart = pieces[1];
  } else if (normalized.includes('.')) {
    const dotPieces = normalized.split('.');
    const isBrazilianGrouping = /^\d{1,3}(?:\.\d{3})+$/.test(normalized);

    if (isBrazilianGrouping) {
      integerPart = normalized.replace(/\./g, '');
    } else if (dotPieces.length === 2 && /^\d+$/.test(dotPieces[0] ?? '') && /^\d{1,2}$/.test(dotPieces[1] ?? '')) {
      integerPart = dotPieces[0] as string;
      decimalPart = dotPieces[1] as string;
    } else {
      throw new TypeError('O valor informado não é uma moeda brasileira válida.');
    }
  } else {
    if (!/^\d+$/.test(normalized)) {
      throw new TypeError('O valor informado não é uma moeda brasileira válida.');
    }
    integerPart = normalized;
  }

  const normalizedInteger = Number(integerPart);
  assertFiniteNumber(normalizedInteger, 'O valor');
  const decimalCents = decimalPart ? Number(decimalPart.padEnd(2, '0')) : 0;
  const cents = normalizedInteger * CENTS_PER_REAL + decimalCents;
  assertCents(cents, 'O valor');
  return cents;
}

/** Retorna `null` para valores vazios ou inválidos, útil em inputs controlados. */
export function tryParseBrlCents(value: string | number | null | undefined): Cents | null {
  if (value === null || value === undefined || (typeof value === 'string' && !value.trim())) {
    return null;
  }

  try {
    return parseBrlCents(value);
  } catch {
    return null;
  }
}

/** Calcula o desconto em centavos sem deixar o desconto ultrapassar a base. */
export function calculateDiscountCents(baseCents: Cents, discount?: Discount): Cents {
  assertCents(baseCents, 'A base do desconto');
  if (!discount) return 0;

  let discountCents: Cents;
  if (discount.type === 'fixed') {
    assertCents(discount.amountCents, 'O desconto fixo');
    discountCents = discount.amountCents;
  } else {
    const basisPoints = percentageToBasisPoints(discount.percentage);
    discountCents = roundToCents((baseCents * basisPoints) / PERCENTAGE_SCALE, 'O desconto percentual');
  }

  if (discountCents > baseCents) {
    throw new RangeError('O desconto não pode ultrapassar o valor-base.');
  }
  return discountCents;
}

/** Calcula uma linha comercial com desconto por item. */
export function calculateContractItem(item: ContractItemInput): CalculatedContractItem {
  assertFiniteNumber(item.quantity, 'A quantidade');
  if (item.quantity <= 0) throw new RangeError('A quantidade deve ser maior que zero.');
  assertCents(item.unitPriceCents, 'O valor unitário');

  const grossCents = roundToCents(item.quantity * item.unitPriceCents, 'O valor bruto do item');
  const discountCents = calculateDiscountCents(grossCents, item.discount);

  return {
    ...item,
    grossCents,
    discountCents,
    totalCents: grossCents - discountCents,
  };
}

/**
 * Calcula o contrato inteiro. A ordem de cálculo é:
 * item bruto → desconto do item → subtotal → desconto do contrato → custos
 * adicionais. O desconto de contrato incide apenas sobre o subtotal dos itens.
 */
export function calculateContractTotals(input: ContractTotalsInput): ContractTotals {
  const items = input.items.map(calculateContractItem);
  const subtotalCents = items.reduce((total, item) => total + item.totalCents, 0);
  assertCents(subtotalCents, 'O subtotal');

  const itemDiscountsCents = items.reduce((total, item) => total + item.discountCents, 0);
  assertCents(itemDiscountsCents, 'O total de descontos dos itens');

  const contractDiscountCents = calculateDiscountCents(subtotalCents, input.contractDiscount);
  const additionalCostsCents = input.additionalCostsCents ?? 0;
  assertCents(additionalCostsCents, 'Os custos adicionais');

  const totalCents = subtotalCents - contractDiscountCents + additionalCostsCents;
  assertCents(totalCents, 'O total do contrato');

  return {
    items,
    subtotalCents,
    itemDiscountsCents,
    contractDiscountCents,
    additionalCostsCents,
    totalCents,
  };
}

/** Divide um valor em parcelas, distribuindo os centavos excedentes nas primeiras parcelas. */
export function splitCentsIntoInstallments(totalCents: Cents, installmentCount: number): readonly Cents[] {
  assertCents(totalCents, 'O total das parcelas');
  assertPositiveInteger(installmentCount, 'A quantidade de parcelas');

  const baseAmount = Math.floor(totalCents / installmentCount);
  const remainder = totalCents % installmentCount;
  return Array.from({ length: installmentCount }, (_, index) => baseAmount + (index < remainder ? 1 : 0));
}

function parseDateOnly(input: DateInput, field: string): { year: number; month: number; day: number } {
  const value = input instanceof Date
    ? `${input.getUTCFullYear()}-${String(input.getUTCMonth() + 1).padStart(2, '0')}-${String(input.getUTCDate()).padStart(2, '0')}`
    : input.slice(0, 10);
  const match = DATE_ONLY_PATTERN.exec(value);
  if (!match) throw new TypeError(`${field} deve estar no formato YYYY-MM-DD.`);

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new RangeError(`${field} não é uma data válida.`);
  }
  return { year, month, day };
}

function formatDateOnly({ year, month, day }: { year: number; month: number; day: number }): string {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function addMonthsToDateOnly(input: DateInput, monthsToAdd: number): string {
  if (!Number.isSafeInteger(monthsToAdd) || monthsToAdd < 0) {
    throw new RangeError('O intervalo de parcelas deve ser um inteiro não negativo.');
  }
  const { year, month, day } = parseDateOnly(input, 'A primeira data de vencimento');
  const zeroBasedMonth = month - 1 + monthsToAdd;
  const targetYear = year + Math.floor(zeroBasedMonth / 12);
  const targetMonth = (zeroBasedMonth % 12) + 1;
  const daysInTargetMonth = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate();

  return formatDateOnly({ year: targetYear, month: targetMonth, day: Math.min(day, daysInTargetMonth) });
}

/** Cria uma agenda de vencimentos mensal (ou em outro intervalo) com soma exata em centavos. */
export function createInstallmentSchedule(input: InstallmentScheduleInput): readonly Installment[] {
  const intervalMonths = input.intervalMonths ?? 1;
  assertPositiveInteger(intervalMonths, 'O intervalo entre parcelas');
  const amounts = splitCentsIntoInstallments(input.totalCents, input.installmentCount);

  return amounts.map((amountCents, index) => ({
    number: index + 1,
    amountCents,
    // Calculamos sempre a partir da primeira data para preservar o dia 31
    // quando o mês seguinte permitir (31 jan → 28 fev → 31 mar).
    dueDate: addMonthsToDateOnly(input.firstDueDate, index * intervalMonths),
  }));
}

function compareDateOnly(left: DateInput, right: DateInput): number {
  const leftValue = formatDateOnly(parseDateOnly(left, 'A data'));
  const rightValue = formatDateOnly(parseDateOnly(right, 'A data'));
  return leftValue.localeCompare(rightValue);
}

function toInstant(value: DateInput, field: string): Date {
  const date = value instanceof Date
    ? new Date(value.getTime())
    : new Date(DATE_ONLY_PATTERN.test(value) ? `${value}T00:00:00.000Z` : value);
  if (Number.isNaN(date.getTime())) throw new TypeError(`${field} não é uma data/hora válida.`);
  return date;
}

/**
 * Valida um período sem normalizar silenciosamente as datas. Por padrão usa
 * datas (YYYY-MM-DD); para campanhas com horário, use `precision: 'instant'`.
 */
export function validateDateRange(
  startDate?: DateInput | null,
  endDate?: DateInput | null,
  options: ValidateDateRangeOptions = {},
): DateRangeValidation {
  const { precision = 'date', allowOpenEnded = true } = options;

  if (!startDate && !endDate) return { valid: true };
  if (!startDate || !endDate) {
    return allowOpenEnded
      ? { valid: true }
      : { valid: false, message: 'Informe as duas datas do período.' };
  }

  try {
    if (precision === 'instant') {
      if (toInstant(endDate, 'O fim do período').getTime() < toInstant(startDate, 'O início do período').getTime()) {
        return { valid: false, message: 'O fim do período não pode ser anterior ao início.' };
      }
    } else if (compareDateOnly(endDate, startDate) < 0) {
      return { valid: false, message: 'O fim do período não pode ser anterior ao início.' };
    }
  } catch (error) {
    return {
      valid: false,
      message: error instanceof Error ? error.message : 'O período informado é inválido.',
    };
  }

  return { valid: true };
}

/**
 * Deriva apenas os estados temporais de um contrato aprovado/agendado/ativo.
 * Rascunhos, aprovação pendente, pausas e estados terminais são preservados;
 * assim uma data não publica ou encerra um contrato sem uma decisão de negócio.
 */
export function deriveContractStatus(input: ContractStatusDerivationInput): ContractStatus {
  const { currentStatus, startDate, endDate, now = new Date() } = input;
  if (
    currentStatus === 'rascunho' ||
    currentStatus === 'pendente_aprovacao' ||
    currentStatus === 'pausado' ||
    currentStatus === 'expirado' ||
    currentStatus === 'concluido' ||
    currentStatus === 'removido' ||
    currentStatus === 'cancelado' ||
    !startDate ||
    !endDate
  ) {
    return currentStatus;
  }

  const dateRange = validateDateRange(startDate, endDate, { allowOpenEnded: false });
  if (!dateRange.valid) throw new RangeError(dateRange.message);

  if (compareDateOnly(endDate, now) < 0) return 'expirado';
  if (compareDateOnly(startDate, now) > 0) return 'agendado';
  return 'ativo';
}

/**
 * Deriva o estado operacional de uma campanha. O chamador deve informar a
 * aprovação para publicação: possuir mídia não equivale a estar aprovada.
 */
export function deriveCampaignStatus(input: CampaignStatusDerivationInput): CampaignStatus {
  const {
    currentStatus,
    startAt,
    endAt,
    hasMedia,
    isApprovedForPublication = false,
    isVisible = true,
    now = new Date(),
  } = input;

  if (currentStatus === 'cancelada' || currentStatus === 'rejeitada' || currentStatus === 'expirada') {
    return currentStatus;
  }
  if (currentStatus === 'pausada' || isVisible === false) return 'pausada';
  if (currentStatus === 'rascunho') return 'rascunho';
  if (!hasMedia) return 'aguardando_midia';
  if (!isApprovedForPublication) return 'em_revisao';
  if (!startAt || !endAt) return 'em_revisao';

  const dateRange = validateDateRange(startAt, endAt, { precision: 'instant', allowOpenEnded: false });
  if (!dateRange.valid) throw new RangeError(dateRange.message);

  const starts = toInstant(startAt, 'O início da campanha');
  const ends = toInstant(endAt, 'O fim da campanha');
  const current = toInstant(now, 'A data atual');
  if (ends.getTime() < current.getTime()) return 'expirada';
  if (starts.getTime() > current.getTime()) return 'agendada';
  return 'ativa';
}

/** Deriva o estado de uma parcela usando valor pago e vencimento. */
export function derivePaymentStatus(input: PaymentStatusDerivationInput): PaymentStatus {
  const { amountCents, paidCents = 0, dueDate, currentStatus, now = new Date() } = input;
  assertCents(amountCents, 'O valor da parcela');
  assertCents(paidCents, 'O valor pago');
  if (paidCents > amountCents) {
    throw new RangeError('O valor pago não pode ultrapassar o valor da parcela.');
  }
  if (currentStatus === 'cancelado' || currentStatus === 'estornado') return currentStatus;
  if (paidCents === amountCents) return 'pago';
  if (dueDate && compareDateOnly(dueDate, now) < 0) return 'atrasado';
  if (paidCents > 0) return 'parcial';
  return 'pendente';
}

/**
 * Consolida o estado financeiro de um contrato a partir das parcelas. Parcelas
 * canceladas ou estornadas não impedem que as demais sejam consideradas pagas.
 */
export function deriveContractPaymentStatus(payments: readonly PaymentStatusDerivationInput[]): PaymentStatus {
  if (payments.length === 0) return 'pendente';

  const statuses = payments.map(derivePaymentStatus);
  const collectible = statuses.filter((status) => status !== 'cancelado' && status !== 'estornado');

  if (collectible.length === 0) {
    return statuses.includes('estornado') ? 'estornado' : 'cancelado';
  }
  if (collectible.every((status) => status === 'pago')) return 'pago';
  if (collectible.includes('atrasado')) return 'atrasado';
  if (collectible.some((status) => status === 'pago' || status === 'parcial')) return 'parcial';
  return 'pendente';
}

type TransitionMap<T extends string> = Readonly<Record<T, readonly T[]>>;

export const CONTRACT_STATUS_USER_TRANSITIONS = {
  rascunho: ['pendente_aprovacao', 'cancelado', 'removido'],
  pendente_aprovacao: ['rascunho', 'aprovado', 'cancelado', 'removido'],
  aprovado: ['agendado', 'ativo', 'pausado', 'cancelado'],
  agendado: ['ativo', 'pausado', 'cancelado'],
  ativo: ['pausado', 'expirado', 'concluido', 'cancelado'],
  pausado: ['agendado', 'ativo', 'expirado', 'cancelado'],
  expirado: ['concluido', 'removido'],
  concluido: ['removido'],
  removido: [],
  cancelado: [],
} as const satisfies TransitionMap<ContractStatus>;

export const CONTRACT_STATUS_AUTOMATION_TRANSITIONS = {
  rascunho: [],
  pendente_aprovacao: [],
  aprovado: ['agendado', 'ativo', 'expirado'],
  agendado: ['ativo', 'expirado'],
  ativo: ['expirado'],
  pausado: ['expirado'],
  expirado: [],
  concluido: [],
  removido: [],
  cancelado: [],
} as const satisfies TransitionMap<ContractStatus>;

export const CAMPAIGN_STATUS_USER_TRANSITIONS = {
  rascunho: ['aguardando_midia', 'em_revisao', 'cancelada'],
  aguardando_midia: ['rascunho', 'em_revisao', 'cancelada'],
  em_revisao: ['rascunho', 'aguardando_midia', 'agendada', 'rejeitada', 'cancelada'],
  agendada: ['ativa', 'pausada', 'cancelada'],
  ativa: ['pausada', 'expirada', 'cancelada'],
  pausada: ['em_revisao', 'agendada', 'ativa', 'expirada', 'cancelada'],
  expirada: [],
  rejeitada: ['rascunho', 'aguardando_midia', 'cancelada'],
  cancelada: [],
} as const satisfies TransitionMap<CampaignStatus>;

export const CAMPAIGN_STATUS_AUTOMATION_TRANSITIONS = {
  rascunho: [],
  aguardando_midia: ['em_revisao'],
  em_revisao: ['agendada', 'ativa'],
  agendada: ['ativa', 'expirada'],
  ativa: ['expirada'],
  pausada: ['expirada'],
  expirada: [],
  rejeitada: [],
  cancelada: [],
} as const satisfies TransitionMap<CampaignStatus>;

export const PAYMENT_STATUS_USER_TRANSITIONS = {
  pendente: ['parcial', 'pago', 'cancelado'],
  parcial: ['pago', 'cancelado'],
  pago: ['estornado'],
  atrasado: ['parcial', 'pago', 'cancelado'],
  cancelado: [],
  estornado: [],
} as const satisfies TransitionMap<PaymentStatus>;

export const PAYMENT_STATUS_AUTOMATION_TRANSITIONS = {
  pendente: ['atrasado'],
  parcial: ['atrasado'],
  pago: [],
  atrasado: [],
  cancelado: [],
  estornado: [],
} as const satisfies TransitionMap<PaymentStatus>;

function hasTransition<T extends string>(
  map: TransitionMap<T>,
  from: T,
  to: T,
): boolean {
  return (map[from] as readonly T[]).includes(to);
}

export function canTransitionContractStatus(
  from: ContractStatus,
  to: ContractStatus,
  actor: TransitionActor = 'user',
): boolean {
  if (from === to) return true;
  return hasTransition(CONTRACT_STATUS_USER_TRANSITIONS, from, to) || (
    actor === 'automation' && hasTransition(CONTRACT_STATUS_AUTOMATION_TRANSITIONS, from, to)
  );
}

export function canTransitionCampaignStatus(
  from: CampaignStatus,
  to: CampaignStatus,
  actor: TransitionActor = 'user',
): boolean {
  if (from === to) return true;
  return hasTransition(CAMPAIGN_STATUS_USER_TRANSITIONS, from, to) || (
    actor === 'automation' && hasTransition(CAMPAIGN_STATUS_AUTOMATION_TRANSITIONS, from, to)
  );
}

export function canTransitionPaymentStatus(
  from: PaymentStatus,
  to: PaymentStatus,
  actor: TransitionActor = 'user',
): boolean {
  if (from === to) return true;
  return hasTransition(PAYMENT_STATUS_USER_TRANSITIONS, from, to) || (
    actor === 'automation' && hasTransition(PAYMENT_STATUS_AUTOMATION_TRANSITIONS, from, to)
  );
}

/** Lança um erro claro para actions que recebam uma transição de contrato inválida. */
export function assertContractStatusTransition(
  from: ContractStatus,
  to: ContractStatus,
  actor: TransitionActor = 'user',
): void {
  if (!canTransitionContractStatus(from, to, actor)) {
    throw new RangeError(`A transição de contrato ${from} → ${to} não é permitida.`);
  }
}

/** Lança um erro claro para actions que recebam uma transição de campanha inválida. */
export function assertCampaignStatusTransition(
  from: CampaignStatus,
  to: CampaignStatus,
  actor: TransitionActor = 'user',
): void {
  if (!canTransitionCampaignStatus(from, to, actor)) {
    throw new RangeError(`A transição de campanha ${from} → ${to} não é permitida.`);
  }
}

/** Lança um erro claro para actions que recebam uma transição financeira inválida. */
export function assertPaymentStatusTransition(
  from: PaymentStatus,
  to: PaymentStatus,
  actor: TransitionActor = 'user',
): void {
  if (!canTransitionPaymentStatus(from, to, actor)) {
    throw new RangeError(`A transição de pagamento ${from} → ${to} não é permitida.`);
  }
}
