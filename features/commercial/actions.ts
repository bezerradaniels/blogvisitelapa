'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
  assertCampaignStatusTransition,
  assertContractStatusTransition,
  assertPaymentStatusTransition,
  calculateContractTotals,
  createInstallmentSchedule,
  validateDateRange,
} from '@/features/commercial';
import { adminGuard } from '@/lib/auth/adminGuard';
import { slugify } from '@/lib/utils/format';
import type { Json } from '@/types/database';
import type { CommercialContractDraft } from './types';

type ActionResult = { ok: true; id?: string; warning?: string } | { ok: false; error: string; duplicates?: ClientDuplicate[] };

export interface ClientDuplicate {
  id: string;
  clientName: string;
  reason: 'documento' | 'e-mail' | 'telefone' | 'nome';
}

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe uma data válida.');
const uuidSchema = z.string().uuid('Identificador inválido.');
const placementSchema = z.enum([
  'home_top', 'home_middle', 'home_carousel', 'post_sidebar',
  'post_inline_mobile', 'category_top', 'event_sidebar', 'fixed_carousel_sponsor',
]);
const campaignStatusSchema = z.enum([
  'rascunho', 'aguardando_midia', 'em_revisao', 'agendada', 'ativa',
  'pausada', 'expirada', 'rejeitada', 'cancelada',
]);
const contractStatusSchema = z.enum([
  'rascunho', 'pendente_aprovacao', 'aprovado', 'agendado', 'ativo',
  'pausado', 'expirado', 'concluido', 'removido', 'cancelado',
]);
const paymentStatusSchema = z.enum(['pendente', 'parcial', 'pago', 'atrasado', 'cancelado', 'estornado']);

const itemSchema = z.object({
  productId: uuidSchema.nullish(),
  customName: z.string().trim().min(2, 'Cada item precisa de um nome.'),
  description: z.string().trim().max(3000).optional().default(''),
  quantity: z.number().finite().positive('A quantidade deve ser maior que zero.').max(100_000),
  unitPriceCents: z.number().int().min(0),
  discountCents: z.number().int().min(0),
  startDate: dateSchema.optional().or(z.literal('')),
  endDate: dateSchema.optional().or(z.literal('')),
  placement: placementSchema.optional().or(z.literal('')),
  placementId: uuidSchema.nullish(),
  requiresMediaUpload: z.boolean(),
  requiresContentCreation: z.boolean(),
  notes: z.string().trim().max(5000).optional().default(''),
});

const campaignSchema = z.object({
  itemIndex: z.number().int().min(0),
  campaignName: z.string().trim().min(2, 'Informe o nome da campanha.'),
  placement: placementSchema,
  placementId: uuidSchema.nullish(),
  desktopMediaUrl: z.string().url('A URL da mídia desktop é inválida.').optional().or(z.literal('')),
  mobileMediaUrl: z.string().url('A URL da mídia mobile é inválida.').optional().or(z.literal('')),
  alternativeText: z.string().trim().max(240).optional().default(''),
  destinationUrl: z.string().url('A URL de destino é inválida.').optional().or(z.literal('')),
  startAt: z.string().trim().min(16, 'Informe início da campanha.'),
  endAt: z.string().trim().min(16, 'Informe fim da campanha.'),
  priority: z.number().int().min(0).max(100_000),
  rotationWeight: z.number().int().positive().max(100_000),
  isVisible: z.boolean(),
  clickTrackingEnabled: z.boolean(),
  impressionTrackingEnabled: z.boolean(),
  status: campaignStatusSchema,
});

const paymentSchema = z.object({
  installmentNumber: z.number().int().positive(),
  description: z.string().trim().max(500).optional().default(''),
  amountCents: z.number().int().min(0),
  paidAmountCents: z.number().int().min(0).optional().default(0),
  dueDate: dateSchema,
  paymentMethod: z.string().trim().max(100).optional().default(''),
  status: paymentStatusSchema.optional().default('pendente'),
  notes: z.string().trim().max(5000).optional().default(''),
});

const contractSchema = z.object({
  id: uuidSchema.optional(),
  clientId: uuidSchema,
  advertiserId: uuidSchema.optional().or(z.literal('')),
  title: z.string().trim().min(3, 'Informe o título do contrato.').max(180),
  description: z.string().trim().max(5000).optional().default(''),
  startDate: dateSchema,
  endDate: dateSchema,
  internalNotes: z.string().trim().max(5000).optional().default(''),
  clientNotes: z.string().trim().max(5000).optional().default(''),
  renewalEnabled: z.boolean(),
  renewalPeriodDays: z.number().int().positive().max(3650).optional(),
  renewalNoticeDays: z.number().int().min(0).max(3650),
  contractDiscountType: z.enum(['valor', 'percentual']).optional().or(z.literal('')),
  contractDiscountValue: z.number().finite().min(0),
  additionalCostsCents: z.number().int().min(0),
  paymentMethod: z.string().trim().max(100).optional().default(''),
  paymentTerms: z.string().trim().max(1000).optional().default(''),
  installmentCount: z.number().int().positive().max(120),
  billingDueDate: dateSchema.optional().or(z.literal('')),
  items: z.array(itemSchema).min(1, 'Adicione ao menos um produto ou serviço.'),
  campaigns: z.array(campaignSchema).default([]),
  payments: z.array(paymentSchema).default([]),
  status: z.enum(['rascunho', 'pendente_aprovacao']),
});

export type QuickClientInput = {
  clientName: string;
  email?: string;
  phone?: string;
  document?: string;
  clientType?: 'pessoa_fisica' | 'empresa' | 'agencia' | 'instituicao_publica';
  confirmSimilar?: boolean;
};

const quickClientSchema = z.object({
  clientName: z.string().trim().min(2, 'Informe o nome do cliente.').max(180),
  email: z.string().trim().email('Informe um e-mail válido.').optional().or(z.literal('')),
  phone: z.string().trim().min(8).max(30).optional().or(z.literal('')),
  document: z.string().trim().min(11).max(18).optional().or(z.literal('')),
  clientType: z.enum(['pessoa_fisica', 'empresa', 'agencia', 'instituicao_publica']).optional().default('empresa'),
  confirmSimilar: z.boolean().optional().default(false),
});

function errorMessage(error: { code?: string; message?: string } | null, fallback: string): string {
  if (!error) return fallback;
  if (error.code === '23505') return 'Já existe um registro com estes dados. Revise documento, e-mail ou número do contrato.';
  if (error.code === '42501') return 'Você não tem permissão para esta operação comercial.';
  return fallback;
}

function decimalFromCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

function bahiaTimestamp(value: string): string {
  const normalized = value.trim();
  if (/([zZ]|[+-]\d{2}:?\d{2})$/.test(normalized)) return normalized;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(normalized)) {
    throw new RangeError('A data e hora da campanha é inválida.');
  }
  return `${normalized.length === 16 ? `${normalized}:00` : normalized}-03:00`;
}

function contractPaths(id?: string): void {
  revalidatePath('/admin/comercial');
  revalidatePath('/admin/comercial/contratos');
  revalidatePath('/admin/comercial/campanhas');
  revalidatePath('/admin/comercial/financeiro');
  revalidatePath('/admin/contratos');
  revalidatePath('/admin/publicidade');
  if (id) revalidatePath(`/admin/comercial/contratos/${id}`);
}

function safeDateRange(start: string | undefined, end: string | undefined, label: string): string | null {
  const result = validateDateRange(start || null, end || null, { allowOpenEnded: false });
  return result.valid ? null : `${label}: ${result.message}`;
}

function safeInstantRange(start: string | undefined, end: string | undefined, label: string): string | null {
  const result = validateDateRange(start || null, end || null, { precision: 'instant', allowOpenEnded: false });
  return result.valid ? null : `${label}: ${result.message}`;
}

export async function createQuickCommercialClient(input: QuickClientInput): Promise<ActionResult> {
  const ctx = await adminGuard();
  if (!ctx) return { ok: false, error: 'Acesso restrito.' };
  const parsed = quickClientSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  const data = parsed.data;
  const document = (data.document ?? '').replace(/\D/g, '');
  const email = (data.email ?? '').toLowerCase();
  const phone = (data.phone ?? '').replace(/\D/g, '');

  const [documentResult, emailResult, phoneResult, nameResult] = await Promise.all([
    document ? ctx.supabase.from('commercial_clients').select('id, client_name').eq('document', document).limit(3) : Promise.resolve({ data: [], error: null }),
    email ? ctx.supabase.from('commercial_clients').select('id, client_name').ilike('email', email).limit(3) : Promise.resolve({ data: [], error: null }),
    phone ? ctx.supabase.from('commercial_clients').select('id, client_name').ilike('whatsapp', `%${phone}%`).limit(3) : Promise.resolve({ data: [], error: null }),
    ctx.supabase.from('commercial_clients').select('id, client_name').ilike('client_name', data.clientName).limit(3),
  ]);
  const duplicates = [
    ...(documentResult.data ?? []).map((client) => ({ id: client.id, clientName: client.client_name, reason: 'documento' as const })),
    ...(emailResult.data ?? []).map((client) => ({ id: client.id, clientName: client.client_name, reason: 'e-mail' as const })),
    ...(phoneResult.data ?? []).map((client) => ({ id: client.id, clientName: client.client_name, reason: 'telefone' as const })),
    ...(nameResult.data ?? []).map((client) => ({ id: client.id, clientName: client.client_name, reason: 'nome' as const })),
  ].filter((duplicate, index, entries) => entries.findIndex((entry) => entry.id === duplicate.id) === index);

  if (duplicates.length > 0 && !data.confirmSimilar) {
    return { ok: false, error: 'Encontramos possíveis clientes duplicados. Confirme para criar mesmo assim.', duplicates };
  }

  const { data: client, error } = await ctx.supabase
    .from('commercial_clients')
    .insert({
      client_name: data.clientName,
      company_name: data.clientName,
      legal_name: data.clientName,
      trade_name: data.clientName,
      client_type: data.clientType,
      email: email || null,
      billing_email: email || null,
      whatsapp: phone || null,
      document: document || null,
      status: 'prospecto',
      is_active: true,
    })
    .select('id')
    .single();
  if (error || !client) return { ok: false, error: errorMessage(error, 'Não foi possível criar o cliente.') };
  revalidatePath('/admin/comercial/clientes');
  revalidatePath('/admin/comercial/contratos/novo');
  return { ok: true, id: client.id };
}

export async function convertCommercialLead(input: { leadId: string; confirmSimilar?: boolean }): Promise<ActionResult> {
  const ctx = await adminGuard();
  if (!ctx) return { ok: false, error: 'Acesso restrito.' };
  const parsed = z.object({ leadId: uuidSchema, confirmSimilar: z.boolean().optional().default(false) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Lead inválido.' };
  const { data: lead, error: leadError } = await ctx.supabase
    .from('advertiser_contacts')
    .select('id, name, company_name, email, whatsapp, status')
    .eq('id', parsed.data.leadId)
    .maybeSingle();
  if (leadError || !lead) return { ok: false, error: 'Lead não encontrado.' };
  const result = await createQuickCommercialClient({
    clientName: lead.company_name?.trim() || lead.name,
    email: lead.email,
    phone: lead.whatsapp ?? '',
    confirmSimilar: parsed.data.confirmSimilar,
  });
  if (!result.ok) return result;
  const { error } = await ctx.supabase.from('advertiser_contacts').update({ status: 'concluido' }).eq('id', lead.id);
  if (error) return { ok: false, error: 'Cliente criado, mas não foi possível concluir o lead.' };
  revalidatePath('/admin/comercial/leads');
  revalidatePath('/admin/comercial/clientes');
  return result;
}

export async function createCommercialBrand(input: {
  clientId: string;
  name: string;
  website?: string;
}): Promise<ActionResult> {
  const ctx = await adminGuard();
  if (!ctx) return { ok: false, error: 'Acesso restrito.' };
  const parsed = z.object({
    clientId: uuidSchema,
    name: z.string().trim().min(2).max(180),
    website: z.string().trim().url().optional().or(z.literal('')),
  }).safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  const { data, error } = await ctx.supabase
    .from('commercial_brands')
    .insert({ client_id: parsed.data.clientId, name: parsed.data.name, website: parsed.data.website || null })
    .select('id')
    .single();
  if (error || !data) return { ok: false, error: errorMessage(error, 'Não foi possível criar a marca.') };
  revalidatePath('/admin/comercial/contratos/novo');
  return { ok: true, id: data.id };
}

export async function createCommercialContract(input: CommercialContractDraft): Promise<ActionResult> {
  const ctx = await adminGuard();
  if (!ctx) return { ok: false, error: 'Acesso restrito.' };
  const parsed = contractSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados do contrato inválidos.' };
  const data = parsed.data;

  const contractDateError = safeDateRange(data.startDate, data.endDate, 'Período do contrato');
  if (contractDateError) return { ok: false, error: contractDateError };
  if (data.renewalEnabled && !data.renewalPeriodDays) {
    return { ok: false, error: 'Informe o período da renovação automática.' };
  }

  for (const [index, item] of data.items.entries()) {
    const itemDateError = safeDateRange(item.startDate || data.startDate, item.endDate || data.endDate, `Item ${index + 1}`);
    if (itemDateError) return { ok: false, error: itemDateError };
    if (item.discountCents > Math.round(item.quantity * item.unitPriceCents)) {
      return { ok: false, error: `O desconto do item ${index + 1} não pode superar seu valor.` };
    }
  }
  for (const campaign of data.campaigns) {
    if (campaign.itemIndex >= data.items.length) return { ok: false, error: 'Uma campanha está vinculada a um item inexistente.' };
    const campaignDateError = safeInstantRange(campaign.startAt, campaign.endAt, 'Período da campanha');
    if (campaignDateError) return { ok: false, error: campaignDateError };
    if (campaign.status === 'ativa' || campaign.status === 'agendada') {
      if (!campaign.desktopMediaUrl) return { ok: false, error: 'Uma campanha agendada ou ativa precisa de mídia desktop.' };
    }
  }

  try {
    const contractDiscount = data.contractDiscountType === 'percentual'
      ? { type: 'percentage' as const, percentage: data.contractDiscountValue }
      : data.contractDiscountType === 'valor'
        ? { type: 'fixed' as const, amountCents: Math.round(data.contractDiscountValue) }
        : undefined;
    const totals = calculateContractTotals({
      items: data.items.map((item) => ({
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        discount: { type: 'fixed' as const, amountCents: item.discountCents },
      })),
      contractDiscount,
      additionalCostsCents: data.additionalCostsCents,
    });
    const payments = data.payments.length > 0
      ? data.payments
      : createInstallmentSchedule({
        totalCents: totals.totalCents,
        installmentCount: data.installmentCount,
        firstDueDate: data.billingDueDate || data.startDate,
      }).map((payment) => ({
        installmentNumber: payment.number,
        amountCents: payment.amountCents,
        paidAmountCents: 0,
        dueDate: payment.dueDate,
        description: '',
        paymentMethod: data.paymentMethod,
        status: 'pendente' as const,
        notes: '',
      }));
    const installmentsTotal = payments.reduce((total, payment) => total + payment.amountCents, 0);
    if (installmentsTotal !== totals.totalCents) {
      return { ok: false, error: 'A soma das parcelas deve ser igual ao valor final do contrato.' };
    }

    const payload = {
      client_id: data.clientId,
      advertiser_id: data.advertiserId || null,
      title: data.title,
      description: data.description || null,
      start_date: data.startDate,
      end_date: data.endDate,
      status: data.status,
      contract_discount_type: data.contractDiscountType || null,
      contract_discount_value: data.contractDiscountType === 'valor'
        ? decimalFromCents(Math.round(data.contractDiscountValue))
        : data.contractDiscountValue,
      additional_costs: decimalFromCents(data.additionalCostsCents),
      payment_method: data.paymentMethod || null,
      payment_terms: data.paymentTerms || null,
      installment_count: payments.length,
      billing_due_date: data.billingDueDate || data.startDate,
      renewal_enabled: data.renewalEnabled,
      renewal_period_days: data.renewalEnabled ? data.renewalPeriodDays : null,
      renewal_notice_days: data.renewalNoticeDays,
      client_notes: data.clientNotes || null,
      internal_notes: data.internalNotes || null,
      items: data.items.map((item) => ({
        product_id: item.productId || null,
        custom_name: item.customName,
        description: item.description || null,
        quantity: item.quantity,
        unit_price: decimalFromCents(item.unitPriceCents),
        discount_amount: decimalFromCents(item.discountCents),
        start_date: item.startDate || data.startDate,
        end_date: item.endDate || data.endDate,
        placement: item.placement || null,
        placement_id: item.placementId || null,
        requires_media_upload: item.requiresMediaUpload,
        requires_content_creation: item.requiresContentCreation,
        delivery_status: 'nao_configurado',
        notes: item.notes || null,
      })),
      payments: payments.map((payment) => ({
        installment_number: payment.installmentNumber,
        description: payment.description || null,
        amount: decimalFromCents(payment.amountCents),
        paid_amount: decimalFromCents(payment.paidAmountCents),
        due_date: payment.dueDate,
        payment_method: payment.paymentMethod || data.paymentMethod || null,
        status: payment.status || 'pendente',
        notes: payment.notes || null,
      })),
      campaigns: data.campaigns.map((campaign) => ({
        contract_item_index: campaign.itemIndex + 1,
        campaign_name: campaign.campaignName,
        placement: campaign.placement,
        placement_id: campaign.placementId || null,
        desktop_media_url: campaign.desktopMediaUrl || null,
        mobile_media_url: campaign.mobileMediaUrl || null,
        alternative_text: campaign.alternativeText || null,
        destination_url: campaign.destinationUrl || null,
        start_at: bahiaTimestamp(campaign.startAt),
        end_at: bahiaTimestamp(campaign.endAt),
        priority: campaign.priority,
        rotation_weight: campaign.rotationWeight,
        is_visible: campaign.isVisible,
        click_tracking_enabled: campaign.clickTrackingEnabled,
        impression_tracking_enabled: campaign.impressionTrackingEnabled,
        status: campaign.status,
      })),
    };
    const { data: id, error } = await ctx.supabase.rpc('create_commercial_contract', { p_payload: payload as unknown as Json });
    if (error || !id) return { ok: false, error: errorMessage(error, 'Não foi possível criar o contrato. Nenhum dado foi publicado.') };
    contractPaths(id);
    return { ok: true, id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Não foi possível calcular o contrato.' };
  }
}

export async function transitionCommercialContract(input: { id: string; status: string; note?: string }): Promise<ActionResult> {
  const ctx = await adminGuard();
  if (!ctx) return { ok: false, error: 'Acesso restrito.' };
  const parsed = z.object({ id: uuidSchema, status: contractStatusSchema, note: z.string().trim().max(1000).optional() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };

  const { data: contract, error: contractError } = await ctx.supabase
    .from('ad_contracts')
    .select('id, status')
    .eq('id', parsed.data.id)
    .maybeSingle();
  if (contractError || !contract) return { ok: false, error: 'Contrato não encontrado.' };
  try {
    assertContractStatusTransition(contract.status, parsed.data.status);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Transição inválida.' };
  }

  const { error } = await ctx.supabase.rpc('transition_commercial_contract_status', {
    p_contract_id: contract.id,
    p_new_status: parsed.data.status,
    p_notes: parsed.data.note || null,
  });
  if (error) return { ok: false, error: errorMessage(error, 'Não foi possível atualizar o status do contrato.') };
  contractPaths(contract.id);
  return { ok: true, id: contract.id };
}

export async function transitionCommercialCampaign(input: { id: string; status: string }): Promise<ActionResult> {
  const ctx = await adminGuard();
  if (!ctx) return { ok: false, error: 'Acesso restrito.' };
  const parsed = z.object({ id: uuidSchema, status: campaignStatusSchema }).safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  const { data: campaign, error: campaignError } = await ctx.supabase
    .from('ad_campaigns')
    .select('id, contract_id, status, desktop_media_url')
    .eq('id', parsed.data.id)
    .maybeSingle();
  if (campaignError || !campaign) return { ok: false, error: 'Campanha não encontrada.' };
  try {
    assertCampaignStatusTransition(campaign.status, parsed.data.status);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Transição inválida.' };
  }
  if (['agendada', 'ativa'].includes(parsed.data.status) && !campaign.desktop_media_url) {
    return { ok: false, error: 'Envie a mídia desktop antes de ativar ou agendar a campanha.' };
  }
  const { error } = await ctx.supabase
    .from('ad_campaigns')
    .update({ status: parsed.data.status, is_visible: parsed.data.status !== 'pausada' && parsed.data.status !== 'cancelada' })
    .eq('id', campaign.id);
  if (error) return { ok: false, error: errorMessage(error, 'Não foi possível atualizar a campanha.') };
  await ctx.supabase.from('contract_history').insert({
    contract_id: campaign.contract_id,
    action: `campanha_${parsed.data.status}`,
    notes: `Campanha ${campaign.id}`,
    created_by: ctx.profileId,
  });
  contractPaths(campaign.contract_id);
  return { ok: true, id: campaign.id };
}

export async function markCommercialPaymentPaid(input: { id: string; paidAmountCents?: number; transactionReference?: string; note?: string }): Promise<ActionResult> {
  const ctx = await adminGuard();
  if (!ctx) return { ok: false, error: 'Acesso restrito.' };
  const parsed = z.object({
    id: uuidSchema,
    paidAmountCents: z.number().int().positive().optional(),
    transactionReference: z.string().trim().max(200).optional(),
    note: z.string().trim().max(1000).optional(),
  }).safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  const { data: payment, error: paymentError } = await ctx.supabase
    .from('contract_payments')
    .select('id, contract_id, status, amount')
    .eq('id', parsed.data.id)
    .maybeSingle();
  if (paymentError || !payment) return { ok: false, error: 'Parcela não encontrada.' };
  const scheduledCents = Math.round(payment.amount * 100);
  const paidCents = parsed.data.paidAmountCents ?? scheduledCents;
  if (paidCents > scheduledCents) return { ok: false, error: 'O valor recebido não pode superar o valor da parcela.' };
  const nextStatus = paidCents === scheduledCents ? 'pago' : 'parcial';
  try {
    assertPaymentStatusTransition(payment.status, nextStatus);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Transição financeira inválida.' };
  }
  if (payment.amount <= 0) return { ok: false, error: 'Uma parcela com valor zero não pode ser marcada como paga.' };
  const { error } = await ctx.supabase
    .from('contract_payments')
    .update({
      status: nextStatus,
      paid_amount: paidCents / 100,
      paid_at: new Date().toISOString(),
      transaction_reference: parsed.data.transactionReference || null,
      notes: parsed.data.note || null,
    })
    .eq('id', payment.id);
  if (error) return { ok: false, error: errorMessage(error, 'Não foi possível confirmar o pagamento.') };
  await ctx.supabase.from('contract_history').insert({
    contract_id: payment.contract_id,
    action: nextStatus === 'pago' ? 'pagamento_confirmado' : 'pagamento_parcial',
    notes: `Parcela ${payment.id} registrada como ${nextStatus}.`,
    created_by: ctx.profileId,
  });
  contractPaths(payment.contract_id);
  return { ok: true, id: payment.contract_id };
}

export async function renewCommercialContract(id: string): Promise<ActionResult> {
  const ctx = await adminGuard();
  if (!ctx) return { ok: false, error: 'Acesso restrito.' };
  if (!uuidSchema.safeParse(id).success) return { ok: false, error: 'Contrato inválido.' };
  const [{ data: contract, error: contractError }, { data: items, error: itemsError }] = await Promise.all([
    ctx.supabase.from('ad_contracts').select('*').eq('id', id).maybeSingle(),
    ctx.supabase.from('contract_items').select('*').eq('contract_id', id).order('created_at'),
  ]);
  if (contractError || !contract || !contract.client_id) return { ok: false, error: 'Contrato não encontrado ou sem cliente para renovação.' };
  if (itemsError || !items?.length) return { ok: false, error: 'Este contrato não possui itens para renovar.' };

  const start = new Date(`${contract.end_date}T12:00:00-03:00`);
  start.setDate(start.getDate() + 1);
  const duration = Math.max(1, Math.round((new Date(`${contract.end_date}T12:00:00-03:00`).getTime() - new Date(`${contract.start_date}T12:00:00-03:00`).getTime()) / 86_400_000) + 1);
  const end = new Date(start);
  end.setDate(end.getDate() + duration - 1);
  const dateKey = (date: Date) => date.toLocaleDateString('en-CA', { timeZone: 'America/Bahia' });
  const newStart = dateKey(start);
  const newEnd = dateKey(end);
  const payload = {
    client_id: contract.client_id,
    advertiser_id: contract.advertiser_id,
    title: `${contract.title} — renovação`,
    description: contract.description,
    start_date: newStart,
    end_date: newEnd,
    status: 'rascunho',
    previous_contract_id: contract.id,
    contract_discount_type: contract.contract_discount_type,
    contract_discount_value: contract.contract_discount_value,
    additional_costs: contract.additional_costs,
    payment_method: contract.payment_method,
    payment_terms: contract.payment_terms,
    installment_count: contract.installment_count,
    billing_due_date: newStart,
    renewal_enabled: contract.renewal_enabled,
    renewal_period_days: contract.renewal_period_days,
    renewal_notice_days: contract.renewal_notice_days,
    client_notes: contract.client_notes,
    internal_notes: contract.internal_notes,
    items: items.map((item) => ({
      product_id: item.product_id,
      custom_name: item.custom_name,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount_amount: item.discount_amount,
      start_date: newStart,
      end_date: newEnd,
      placement: item.placement,
      placement_id: item.placement_id,
      requires_media_upload: item.requires_media_upload,
      requires_content_creation: item.requires_content_creation,
      delivery_status: 'nao_configurado',
      notes: item.notes,
    })),
    payments: [],
    campaigns: [],
  };
  const { data: newId, error } = await ctx.supabase.rpc('create_commercial_contract', { p_payload: payload as unknown as Json });
  if (error || !newId) return { ok: false, error: errorMessage(error, 'Não foi possível gerar o rascunho de renovação.') };
  await ctx.supabase.from('contract_history').insert({
    contract_id: id,
    action: 'renovacao_criada',
    notes: `Rascunho de renovação criado: ${newId}.`,
    created_by: ctx.profileId,
  });
  contractPaths(id);
  contractPaths(newId);
  return { ok: true, id: newId, warning: 'A renovação foi criada como rascunho sem reutilizar campanhas ou mídias.' };
}

export async function saveCommercialProduct(input: {
  id?: string;
  name: string;
  productType: string;
  description?: string;
  defaultPriceCents: number;
  billingModel: string;
  defaultDurationDays?: number;
  placementId?: string;
  requiresMediaUpload: boolean;
  requiresDestinationUrl: boolean;
  requiresContentCreation: boolean;
  isRecurring: boolean;
  isActive: boolean;
}): Promise<ActionResult> {
  const ctx = await adminGuard();
  if (!ctx) return { ok: false, error: 'Acesso restrito.' };
  const parsed = z.object({
    id: uuidSchema.optional(),
    name: z.string().trim().min(2).max(180),
    productType: z.enum(['banner', 'conteudo_patrocinado', 'evento_patrocinado', 'social', 'newsletter', 'guia', 'servico', 'pacote', 'customizado']),
    description: z.string().trim().max(3000).optional().default(''),
    defaultPriceCents: z.number().int().min(0),
    billingModel: z.enum(['valor_fixo', 'diario', 'semanal', 'mensal', 'publicacao', 'impressao', 'clique', 'negociado']),
    defaultDurationDays: z.number().int().positive().max(3650).optional(),
    placementId: uuidSchema.optional().or(z.literal('')),
    requiresMediaUpload: z.boolean(),
    requiresDestinationUrl: z.boolean(),
    requiresContentCreation: z.boolean(),
    isRecurring: z.boolean(),
    isActive: z.boolean(),
  }).safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  const data = parsed.data;
  const slug = slugify(data.name);
  if (!slug) return { ok: false, error: 'Informe um nome válido para gerar o identificador do produto.' };
  const payload = {
    name: data.name,
    slug,
    product_type: data.productType,
    description: data.description || null,
    default_price: data.defaultPriceCents / 100,
    billing_model: data.billingModel,
    default_duration_days: data.defaultDurationDays ?? null,
    placement_id: data.placementId || null,
    requires_media_upload: data.requiresMediaUpload,
    requires_destination_url: data.requiresDestinationUrl,
    requires_content_creation: data.requiresContentCreation,
    is_recurring: data.isRecurring,
    is_active: data.isActive,
  };
  const { data: product, error } = data.id
    ? await ctx.supabase.from('commercial_products').update(payload).eq('id', data.id).select('id').single()
    : await ctx.supabase.from('commercial_products').insert(payload).select('id').single();
  if (error || !product) return { ok: false, error: errorMessage(error, 'Não foi possível salvar o produto do catálogo.') };
  revalidatePath('/admin/comercial/produtos');
  revalidatePath('/admin/comercial/contratos/novo');
  return { ok: true, id: product.id };
}

export async function addCommercialContractFile(input: {
  contractId: string;
  fileType: 'contrato_assinado' | 'briefing' | 'proposta' | 'recibo' | 'midia' | 'outro';
  filePath: string;
  fileName?: string;
}): Promise<ActionResult> {
  const ctx = await adminGuard();
  if (!ctx) return { ok: false, error: 'Acesso restrito.' };
  const parsed = z.object({
    contractId: uuidSchema,
    fileType: z.enum(['contrato_assinado', 'briefing', 'proposta', 'recibo', 'midia', 'outro']),
    filePath: z.string().regex(/^contracts\/[0-9a-f-]+\/[a-z0-9._-]+$/i, 'Caminho de arquivo inválido.'),
    fileName: z.string().trim().max(255).optional(),
  }).safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  if (!parsed.data.filePath.startsWith(`contracts/${parsed.data.contractId}/`)) {
    return { ok: false, error: 'O arquivo deve pertencer ao contrato selecionado.' };
  }
  const { data: contract, error: contractError } = await ctx.supabase
    .from('ad_contracts')
    .select('id')
    .eq('id', parsed.data.contractId)
    .maybeSingle();
  if (contractError || !contract) return { ok: false, error: 'Contrato não encontrado.' };
  const { error } = await ctx.supabase.from('contract_files').insert({
    contract_id: contract.id,
    file_type: parsed.data.fileType,
    file_url: parsed.data.filePath,
    file_name: parsed.data.fileName || null,
    uploaded_by: ctx.profileId,
  });
  if (error) return { ok: false, error: errorMessage(error, 'Não foi possível vincular o arquivo ao contrato.') };
  await ctx.supabase.from('contract_history').insert({
    contract_id: contract.id,
    action: 'arquivo_adicionado',
    notes: parsed.data.fileName || parsed.data.fileType,
    created_by: ctx.profileId,
  });
  contractPaths(contract.id);
  return { ok: true, id: contract.id };
}
