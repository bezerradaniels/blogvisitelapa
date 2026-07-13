'use server';

// Patrocínios só podem nascer de um item de contrato. Isso preserva a
// relação financeira e evita publieditoriais/eventos comerciais soltos.
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { adminGuard } from '@/lib/auth/adminGuard';

export type SponsoredKind = 'article' | 'event';

const idSchema = z.string().uuid('Identificador inválido.');

function paths(kind: SponsoredKind, contractId?: string) {
  revalidatePath('/admin/comercial/conteudo');
  revalidatePath(kind === 'article' ? '/admin/publieditoriais' : '/admin/eventos-patrocinados');
  if (contractId) revalidatePath(`/admin/comercial/contratos/${contractId}`);
}

export async function addSponsored(
  kind: SponsoredKind,
  input: { postId: string; label?: string; contractItemId: string },
) {
  const ctx = await adminGuard();
  if (!ctx) return { ok: false, error: 'Acesso restrito.' };
  const parsed = z.object({
    postId: idSchema,
    contractItemId: idSchema,
    label: z.string().trim().max(160).optional().default(''),
  }).safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };

  const [{ data: post, error: postError }, { data: item, error: itemError }] = await Promise.all([
    ctx.supabase.from('posts').select('id, is_event').eq('id', parsed.data.postId).maybeSingle(),
    ctx.supabase.from('contract_items').select('id, contract_id, start_date, end_date, requires_content_creation').eq('id', parsed.data.contractItemId).maybeSingle(),
  ]);
  if (postError || !post) return { ok: false, error: 'Post ou evento não encontrado.' };
  if ((kind === 'event') !== post.is_event) return { ok: false, error: kind === 'event' ? 'Selecione um evento.' : 'Selecione um artigo, não um evento.' };
  if (itemError || !item) return { ok: false, error: 'Item contratual não encontrado.' };
  if (!item.requires_content_creation) return { ok: false, error: 'O item selecionado não está configurado para conteúdo patrocinado.' };

  const { data: contract, error: contractError } = await ctx.supabase
    .from('ad_contracts')
    .select('id, client_id, start_date, end_date, status')
    .eq('id', item.contract_id)
    .maybeSingle();
  if (contractError || !contract?.client_id) return { ok: false, error: 'O item não possui um contrato comercial válido.' };
  if (['cancelado', 'removido'].includes(contract.status)) return { ok: false, error: 'Não é possível vincular conteúdo a um contrato cancelado ou removido.' };

  const table = kind === 'article' ? 'sponsored_articles' : 'sponsored_events';
  const { data: existing, error: existingError } = await ctx.supabase
    .from(table)
    .select('id')
    .eq('post_id', post.id)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();
  if (existingError) return { ok: false, error: 'Não foi possível verificar o patrocínio atual.' };
  if (existing) return { ok: false, error: 'Este conteúdo já possui um patrocínio ativo. Desative-o antes de trocar o vínculo.' };

  const values = {
    post_id: post.id,
    contract_id: contract.id,
    contract_item_id: item.id,
    client_id: contract.client_id,
    label: parsed.data.label || (kind === 'article' ? 'Conteúdo patrocinado' : 'Evento patrocinado'),
    start_date: item.start_date ?? contract.start_date,
    end_date: item.end_date ?? contract.end_date,
    is_active: true,
  };
  const { error } = kind === 'article'
    ? await ctx.supabase.from('sponsored_articles').insert(values)
    : await ctx.supabase.from('sponsored_events').insert(values);
  if (error) return { ok: false, error: error.code === '23505' ? 'Este conteúdo já está vinculado a um patrocínio.' : 'Não foi possível vincular o patrocínio.' };

  const { error: postUpdateError } = await ctx.supabase.from('posts').update({ is_sponsored: true }).eq('id', post.id);
  if (postUpdateError) return { ok: false, error: 'Patrocínio criado, mas não foi possível atualizar a identificação do conteúdo.' };
  await ctx.supabase.from('contract_history').insert({
    contract_id: contract.id,
    action: kind === 'article' ? 'conteudo_patrocinado_vinculado' : 'evento_patrocinado_vinculado',
    notes: `Conteúdo ${post.id} vinculado ao item ${item.id}.`,
    created_by: ctx.profileId,
  });
  paths(kind, contract.id);
  return { ok: true };
}

export async function toggleSponsored(kind: SponsoredKind, id: string, isActive: boolean) {
  const ctx = await adminGuard();
  if (!ctx) return { ok: false, error: 'Acesso restrito.' };
  if (!idSchema.safeParse(id).success) return { ok: false, error: 'Patrocínio inválido.' };
  const table = kind === 'article' ? 'sponsored_articles' : 'sponsored_events';
  const { data: entry, error: entryError } = await ctx.supabase.from(table).select('id, post_id, contract_id').eq('id', id).maybeSingle();
  if (entryError || !entry) return { ok: false, error: 'Patrocínio não encontrado.' };
  const { error } = await ctx.supabase.from(table).update({ is_active: isActive }).eq('id', id);
  if (error) return { ok: false, error: 'Não foi possível atualizar o patrocínio.' };

  if (!isActive) {
    const [{ count: articleCount }, { count: eventCount }] = await Promise.all([
      ctx.supabase.from('sponsored_articles').select('id', { count: 'exact', head: true }).eq('post_id', entry.post_id).eq('is_active', true),
      ctx.supabase.from('sponsored_events').select('id', { count: 'exact', head: true }).eq('post_id', entry.post_id).eq('is_active', true),
    ]);
    if ((articleCount ?? 0) + (eventCount ?? 0) === 0) {
      await ctx.supabase.from('posts').update({ is_sponsored: false }).eq('id', entry.post_id);
    }
  }
  if (entry.contract_id) {
    await ctx.supabase.from('contract_history').insert({
      contract_id: entry.contract_id,
      action: isActive ? 'patrocinio_ativado' : 'patrocinio_desativado',
      notes: `Patrocínio ${entry.id}.`,
      created_by: ctx.profileId,
    });
  }
  paths(kind, entry.contract_id ?? undefined);
  return { ok: true };
}

// A interface não remove patrocínio definitivamente: desativa-o para manter
// rastreabilidade editorial e comercial.
export async function removeSponsored(kind: SponsoredKind, id: string) {
  return toggleSponsored(kind, id, false);
}
