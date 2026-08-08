'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { adminGuard } from '@/lib/auth/adminGuard';

const placementSchema = z.enum([
  'home_top', 'home_middle', 'home_carousel', 'post_sidebar',
  'post_inline_mobile', 'category_top', 'event_sidebar', 'fixed_carousel_sponsor',
]);

const manualAdSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(2, 'Informe um nome para o banner.').max(180),
  placement: placementSchema,
  mediaUrl: z.string().url().optional().or(z.literal('')),
  destinationUrl: z.string().url('Informe uma URL de destino válida.').optional().or(z.literal('')),
  startAt: z.string().min(16, 'Informe o início da exibição.'),
  endAt: z.string().optional().default(''),
  isActive: z.boolean(),
}).refine((data) => data.mediaUrl, {
  message: 'Envie ao menos uma mídia para o banner.',
});

export type ManualAdInput = z.input<typeof manualAdSchema>;

function refreshManualAds() {
  revalidatePath('/admin/publicidade-manual');
  revalidatePath('/', 'layout');
}

function isServing(ad: { is_active: boolean; start_at: string; end_at: string | null }) {
  const now = Date.now();
  return ad.is_active && new Date(ad.start_at).getTime() <= now && (!ad.end_at || new Date(ad.end_at).getTime() >= now);
}

async function getManualAdState(ctx: NonNullable<Awaited<ReturnType<typeof adminGuard>>>, id: string) {
  const { data } = await ctx.supabase.from('manual_ads').select('is_active, start_at, end_at').eq('id', id).maybeSingle();
  return data;
}

export async function saveManualAd(input: ManualAdInput) {
  const ctx = await adminGuard();
  if (!ctx) return { ok: false as const, error: 'Acesso restrito.' };
  const parsed = manualAdSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  const data = parsed.data;
  if (data.id) {
    const current = await getManualAdState(ctx, data.id);
    if (current && isServing(current)) return { ok: false as const, error: 'Banner em veiculação. Desative-o antes de editar.' };
  }
  const startAt = new Date(data.startAt);
  const endAt = data.endAt ? new Date(data.endAt) : null;
  if (Number.isNaN(startAt.getTime()) || (endAt && Number.isNaN(endAt.getTime()))) return { ok: false as const, error: 'Período inválido.' };
  if (endAt && endAt < startAt) return { ok: false as const, error: 'O término não pode ser anterior ao início.' };

  const payload = {
    title: data.title,
    placement: data.placement,
    desktop_media_url: data.mediaUrl || null,
    mobile_media_url: null,
    alternative_text: null,
    destination_url: data.destinationUrl || null,
    start_at: startAt.toISOString(),
    end_at: endAt?.toISOString() ?? null,
    priority: 0,
    is_active: data.isActive,
    updated_by: ctx.profileId,
  };

  const result = data.id
    ? await ctx.supabase.from('manual_ads').update(payload).eq('id', data.id)
    : await ctx.supabase.from('manual_ads').insert({ ...payload, created_by: ctx.profileId });
  if (result.error) return { ok: false as const, error: 'Não foi possível salvar o banner manual. Verifique se a migração foi aplicada.' };
  refreshManualAds();
  return { ok: true as const };
}

export async function setManualAdActive(id: string, isActive: boolean) {
  const ctx = await adminGuard();
  if (!ctx) return { ok: false as const, error: 'Acesso restrito.' };
  if (!z.string().uuid().safeParse(id).success) return { ok: false as const, error: 'Banner inválido.' };
  const { error } = await ctx.supabase.from('manual_ads').update({ is_active: isActive, updated_by: ctx.profileId }).eq('id', id);
  if (error) return { ok: false as const, error: 'Não foi possível alterar o banner.' };
  refreshManualAds();
  return { ok: true as const };
}

export async function updateManualAdEndAt(id: string, endAt: string) {
  const ctx = await adminGuard();
  if (!ctx) return { ok: false as const, error: 'Acesso restrito.' };
  if (!z.string().uuid().safeParse(id).success) return { ok: false as const, error: 'Banner inválido.' };
  const { data: current, error: currentError } = await ctx.supabase.from('manual_ads').select('start_at').eq('id', id).maybeSingle();
  if (currentError || !current) return { ok: false as const, error: 'Banner não encontrado.' };

  const parsedEndAt = endAt ? new Date(endAt) : null;
  if (parsedEndAt && Number.isNaN(parsedEndAt.getTime())) return { ok: false as const, error: 'Informe uma data de término válida.' };
  if (parsedEndAt && parsedEndAt < new Date(current.start_at)) return { ok: false as const, error: 'O término não pode ser anterior ao início.' };

  const { error } = await ctx.supabase.from('manual_ads').update({
    end_at: parsedEndAt?.toISOString() ?? null,
    updated_by: ctx.profileId,
  }).eq('id', id);
  if (error) return { ok: false as const, error: 'Não foi possível alterar a data de término.' };
  refreshManualAds();
  return { ok: true as const };
}

export async function deleteManualAd(id: string) {
  const ctx = await adminGuard();
  if (!ctx) return { ok: false as const, error: 'Acesso restrito.' };
  if (!z.string().uuid().safeParse(id).success) return { ok: false as const, error: 'Banner inválido.' };
  const current = await getManualAdState(ctx, id);
  if (current && isServing(current)) return { ok: false as const, error: 'Banner em veiculação. Desative-o antes de excluir.' };
  const { error } = await ctx.supabase.from('manual_ads').delete().eq('id', id);
  if (error) return { ok: false as const, error: 'Não foi possível excluir o banner.' };
  refreshManualAds();
  return { ok: true as const };
}
