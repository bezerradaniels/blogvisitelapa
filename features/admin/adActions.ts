'use server';

// Ações admin para contratos de publicidade (recurso central).
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { adminGuard } from '@/lib/auth/adminGuard';
import type { AdContractStatus } from '@/types/database';

const contractSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(2, 'Informe o título do anúncio.'),
  contract_type: z.string().optional().default(''),
  ad_type: z.string().optional().default(''),
  client_id: z.string().uuid().optional().or(z.literal('')).default(''),
  company_name: z.string().optional().default(''),
  start_date: z.string().min(1, 'Informe a data de início.'),
  end_date: z.string().min(1, 'Informe a data de término.'),
  negotiated_value: z.string().optional().default(''),
  payment_method: z.string().optional().default(''),
  payment_status: z.enum(['pendente', 'parcial', 'pago', 'atrasado', 'cancelado']).optional().default('pendente'),
  payment_notes: z.string().optional().default(''),
  internal_notes: z.string().optional().default(''),
  placement: z.enum([
    'home_top', 'home_middle', 'home_carousel', 'post_sidebar',
    'post_inline_mobile', 'category_top', 'event_sidebar', 'fixed_carousel_sponsor',
  ]),
  banner_url: z.string().optional().default(''),
  link_url: z.string().optional().default(''),
  priority: z.string().optional().default('0'),
  renewal_enabled: z.boolean().optional().default(false),
  status: z.enum(['rascunho', 'agendado', 'ativo', 'pausado', 'expirado', 'removido', 'cancelado']).optional().default('rascunho'),
});

export type ContractInput = z.input<typeof contractSchema>;

export async function saveContract(input: ContractInput) {
  const ctx = await adminGuard();
  if (!ctx) return { ok: false, error: 'Acesso restrito.' };

  // O formulário legado misturava contrato, banner e cobrança em um único
  // registro. Novos contratos precisam usar o fluxo comercial com itens,
  // campanhas e parcelas atômicos.
  if (!input.id) {
    return { ok: false, error: 'Use o novo fluxo em Comercial → Contratos para criar um contrato.' };
  }

  const parsed = contractSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  const d = parsed.data;
  if (new Date(d.end_date) < new Date(d.start_date)) {
    return { ok: false, error: 'A data de término não pode ser anterior ao início.' };
  }

  const payload = {
    title: d.title.trim(),
    contract_type: d.contract_type.trim() || null,
    ad_type: d.ad_type.trim() || null,
    client_id: d.client_id || null,
    company_name: d.company_name.trim() || null,
    start_date: d.start_date,
    end_date: d.end_date,
    negotiated_value: d.negotiated_value ? Number(d.negotiated_value) : null,
    payment_method: d.payment_method.trim() || null,
    payment_status: d.payment_status,
    payment_notes: d.payment_notes.trim() || null,
    internal_notes: d.internal_notes.trim() || null,
    placement: d.placement,
    banner_url: d.banner_url.trim() || null,
    link_url: d.link_url.trim() || null,
    priority: Number(d.priority) || 0,
    renewal_enabled: d.renewal_enabled,
    updated_by: ctx.profileId,
  };

  let contractId = d.id;
  if (d.id) {
    const { error } = await ctx.supabase.from('ad_contracts').update(payload).eq('id', d.id);
    if (error) return { ok: false, error: 'Não foi possível salvar o contrato.' };
  } else {
    const { data, error } = await ctx.supabase
      .from('ad_contracts')
      .insert({ ...payload, created_by: ctx.profileId })
      .select('id')
      .single();
    if (error || !data) return { ok: false, error: 'Não foi possível criar o contrato.' };
    contractId = data.id;
    await ctx.supabase.from('contract_history').insert({
      contract_id: contractId, action: 'criado', created_by: ctx.profileId,
    });
  }

  revalidatePath('/admin/contratos');
  revalidatePath('/');
  return { ok: true, id: contractId };
}

const STATUS_LABEL: Record<string, string> = {
  ativo: 'ativado', pausado: 'pausado', removido: 'removido',
  cancelado: 'cancelado', agendado: 'agendado',
};

export async function setContractStatus(id: string, status: AdContractStatus) {
  const ctx = await adminGuard();
  if (!ctx) return { ok: false, error: 'Acesso restrito.' };
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: 'Contrato inválido.' };
  const { error } = await ctx.supabase.rpc('transition_commercial_contract_status', {
    p_contract_id: id,
    p_new_status: status,
    p_notes: `Alteração solicitada pela rota legada (${STATUS_LABEL[status] ?? status}).`,
  });
  if (error) return { ok: false, error: 'Não foi possível atualizar o status do contrato.' };
  revalidatePath('/admin/contratos');
  revalidatePath('/admin/comercial/contratos');
  revalidatePath('/');
  return { ok: true };
}

export async function deleteContract(id: string) {
  const ctx = await adminGuard();
  if (!ctx) return { ok: false, error: 'Acesso restrito.' };
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: 'Contrato inválido.' };
  const { error } = await ctx.supabase.rpc('transition_commercial_contract_status', {
    p_contract_id: id,
    p_new_status: 'cancelado',
    p_notes: 'Cancelado pela ação legada; a exclusão física não é permitida.',
  });
  if (error) return { ok: false, error: 'Não foi possível cancelar o contrato.' };
  revalidatePath('/admin/contratos');
  revalidatePath('/admin/comercial/contratos');
  return { ok: true, archived: true };
}
