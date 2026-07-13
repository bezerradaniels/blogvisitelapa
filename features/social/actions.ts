'use server';

// Server Actions da camada social (perfil, amizades, mural, depoimentos).
// Autorização real na RLS (migration 0014); aqui há validação e apoio.
// Conteúdo (recados/depoimentos) é texto puro.
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { slugify } from '@/lib/utils/format';

export interface ActionResult {
  ok: boolean;
  error?: string | null;
  slug?: string;
}

async function requireProfile() {
  const user = await getCurrentUser();
  if (!user?.profile) {
    return { profileId: null, slug: null, supabase: null, error: 'É preciso estar logado.' };
  }
  const supabase = await createClient();
  return { profileId: user.profile.id, slug: user.profile.slug, supabase, error: null };
}

async function uniqueProfileSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  base: string,
  ownId: string,
): Promise<string> {
  const root = slugify(base) || 'usuario';
  let slug = root;
  for (let i = 2; i < 60; i++) {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('slug', slug)
      .neq('id', ownId)
      .maybeSingle();
    if (!data) return slug;
    slug = `${root}-${i}`;
  }
  return `${root}-${Date.now()}`;
}

// -------------------------------------------------------------------------
// Perfil (campos básicos + visibilidade + slug)
// -------------------------------------------------------------------------
const profileSchema = z.object({
  full_name: z.string().min(2, 'Informe seu nome.').max(120),
  bio: z.string().max(500).optional().default(''),
  avatar_url: z.string().url().optional().or(z.literal('')).default(''),
  phone: z.string().max(40).optional().default(''),
  nickname: z.string().max(60).optional().default(''),
  city: z.string().max(120).optional().default(''),
  birth_date: z.string().optional().default(''),
  relationship: z.string().max(60).optional().default(''),
  interests: z.string().max(2000).optional().default(''),
  about: z.string().max(4000).optional().default(''),
  visibility: z.enum(['publico', 'amigos', 'oculto']),
});

export async function saveProfile(input: z.input<typeof profileSchema>): Promise<ActionResult> {
  const { profileId, slug, supabase, error } = await requireProfile();
  if (!profileId || !supabase) return { ok: false, error };

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  const v = parsed.data;

  // Garante slug único (gera na primeira vez a partir de apelido/nome).
  let finalSlug = slug ?? '';
  if (!finalSlug) {
    finalSlug = await uniqueProfileSlug(supabase, v.nickname || v.full_name, profileId);
  }

  const { error: pErr } = await supabase
    .from('profiles')
    .update({
      full_name: v.full_name.trim(),
      bio: v.bio.trim() || null,
      phone: v.phone.trim() || null,
      avatar_url: v.avatar_url || null,
      slug: finalSlug,
    })
    .eq('id', profileId);
  if (pErr) return { ok: false, error: 'Não foi possível salvar o perfil.' };

  const { error: dErr } = await supabase.from('profile_details').upsert(
    {
      profile_id: profileId,
      visibility: v.visibility,
      nickname: v.nickname.trim() || null,
      city: v.city.trim() || null,
      birth_date: v.birth_date || null,
      relationship: v.relationship.trim() || null,
      interests: v.interests.trim() || null,
      about: v.about.trim() || null,
    },
    { onConflict: 'profile_id' },
  );
  if (dErr) return { ok: false, error: `Não foi possível salvar os detalhes do perfil: ${dErr.message}` };

  revalidatePath('/perfil');
  revalidatePath(`/u/${finalSlug}`);
  return { ok: true, slug: finalSlug };
}

// -------------------------------------------------------------------------
// Amizades
// -------------------------------------------------------------------------
export async function sendFriendRequest(targetProfileId: string): Promise<ActionResult> {
  const { profileId, supabase, error } = await requireProfile();
  if (!profileId || !supabase) return { ok: false, error };
  if (targetProfileId === profileId) return { ok: false, error: 'Você não pode adicionar a si mesmo.' };

  // Se já existe pedido do outro lado, aceita em vez de duplicar.
  const { data: existing } = await supabase
    .from('friendships')
    .select('id, requester_id, addressee_id, status')
    .or(
      `and(requester_id.eq.${profileId},addressee_id.eq.${targetProfileId}),and(requester_id.eq.${targetProfileId},addressee_id.eq.${profileId})`,
    )
    .maybeSingle();

  if (existing) {
    if (existing.status === 'pendente' && existing.addressee_id === profileId) {
      await supabase.from('friendships').update({ status: 'aceito' }).eq('id', existing.id);
      await supabase.rpc('push_notification', {
        p_recipient: targetProfileId,
        p_type: 'amizade_aceita',
        p_entity: null,
      });
    }
    return { ok: true };
  }

  // Respeita a permissão de pedido de amizade do alvo (a RLS também reforça).
  const { data: allowed } = await supabase.rpc('can_request_friendship', {
    p_target: targetProfileId,
  });
  if (!allowed) {
    return { ok: false, error: 'Esta pessoa não está aceitando pedidos de amizade.' };
  }

  const { data: friendship, error: err } = await supabase
    .from('friendships')
    .insert({ requester_id: profileId, addressee_id: targetProfileId })
    .select('id')
    .single();
  if (err || !friendship) return { ok: false, error: 'Não foi possível enviar o pedido.' };
  await supabase.rpc('push_notification', {
    p_recipient: targetProfileId,
    p_type: 'amizade_pedido',
    p_entity: friendship.id,
  });
  return { ok: true };
}

export async function acceptFriendRequest(requesterProfileId: string): Promise<ActionResult> {
  const { profileId, supabase, error } = await requireProfile();
  if (!profileId || !supabase) return { ok: false, error };

  const { error: err } = await supabase
    .from('friendships')
    .update({ status: 'aceito' })
    .eq('requester_id', requesterProfileId)
    .eq('addressee_id', profileId)
    .eq('status', 'pendente');
  if (err) return { ok: false, error: 'Não foi possível aceitar o pedido.' };
  await supabase.rpc('push_notification', {
    p_recipient: requesterProfileId,
    p_type: 'amizade_aceita',
    p_entity: null,
  });
  revalidatePath('/perfil');
  return { ok: true };
}

// Desfaz amizade, cancela pedido enviado ou recusa pedido recebido.
export async function removeFriendship(otherProfileId: string): Promise<ActionResult> {
  const { profileId, supabase, error } = await requireProfile();
  if (!profileId || !supabase) return { ok: false, error };

  const { error: err } = await supabase.rpc('remove_friendship', { p_other: otherProfileId });
  if (err) return { ok: false, error: 'Não foi possível atualizar a amizade.' };
  revalidatePath('/perfil');
  revalidatePath('/notificacoes');
  return { ok: true };
}

// -------------------------------------------------------------------------
// Mural / recados (só amigos — RLS reforça)
// -------------------------------------------------------------------------
const scrapSchema = z.object({ content: z.string().min(1, 'Escreva um recado.').max(1000) });

export async function postScrap(
  profileId: string,
  input: z.input<typeof scrapSchema>,
): Promise<ActionResult> {
  const { profileId: me, supabase, error } = await requireProfile();
  if (!me || !supabase) return { ok: false, error };

  const parsed = scrapSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };

  const { error: err } = await supabase
    .from('scraps')
    .insert({ profile_id: profileId, author_id: me, content: parsed.data.content.trim() });
  if (err) return { ok: false, error: 'Não foi possível enviar o recado (só amigos podem postar).' };
  await supabase.rpc('push_notification', { p_recipient: profileId, p_type: 'recado', p_entity: null });
  return { ok: true };
}

export async function deleteScrap(scrapId: string): Promise<ActionResult> {
  const { supabase, error } = await requireProfile();
  if (!supabase) return { ok: false, error };
  const { error: err } = await supabase.from('scraps').delete().eq('id', scrapId);
  if (err) return { ok: false, error: 'Não foi possível remover o recado.' };
  return { ok: true };
}

// -------------------------------------------------------------------------
// Depoimentos (só amigos escrevem; dono aprova/oculta)
// -------------------------------------------------------------------------
const testimonialSchema = z.object({ content: z.string().min(1, 'Escreva o depoimento.').max(2000) });

export async function postTestimonial(
  profileId: string,
  input: z.input<typeof testimonialSchema>,
): Promise<ActionResult> {
  const { profileId: me, supabase, error } = await requireProfile();
  if (!me || !supabase) return { ok: false, error };

  const parsed = testimonialSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };

  // Um depoimento por autor/perfil; reenviar reabre como pendente.
  const { error: err } = await supabase.from('testimonials').upsert(
    { profile_id: profileId, author_id: me, content: parsed.data.content.trim(), status: 'pendente' },
    { onConflict: 'profile_id,author_id' },
  );
  if (err) {
    return { ok: false, error: 'Não foi possível enviar o depoimento (só amigos podem escrever).' };
  }
  await supabase.rpc('push_notification', { p_recipient: profileId, p_type: 'depoimento', p_entity: null });
  return { ok: true };
}

async function updateTestimonialStatus(
  id: string,
  status: 'aprovado' | 'oculto',
): Promise<ActionResult> {
  const { supabase, error } = await requireProfile();
  if (!supabase) return { ok: false, error };
  const { error: err } = await supabase.from('testimonials').update({ status }).eq('id', id);
  if (err) return { ok: false, error: 'Ação não permitida.' };
  revalidatePath('/perfil');
  return { ok: true };
}

export async function approveTestimonial(id: string) {
  return updateTestimonialStatus(id, 'aprovado');
}

export async function hideTestimonial(id: string) {
  return updateTestimonialStatus(id, 'oculto');
}

export async function deleteTestimonial(id: string): Promise<ActionResult> {
  const { supabase, error } = await requireProfile();
  if (!supabase) return { ok: false, error };
  const { error: err } = await supabase.from('testimonials').delete().eq('id', id);
  if (err) return { ok: false, error: 'Não foi possível remover o depoimento.' };
  revalidatePath('/perfil');
  return { ok: true };
}

// -------------------------------------------------------------------------
// Bloqueio (remove amizade nos dois sentidos e impede novas interações)
// -------------------------------------------------------------------------
export async function blockUser(targetProfileId: string): Promise<ActionResult> {
  const { profileId, supabase, error } = await requireProfile();
  if (!profileId || !supabase) return { ok: false, error };
  if (targetProfileId === profileId) return { ok: false, error: 'Ação inválida.' };

  await supabase
    .from('friendships')
    .delete()
    .or(
      `and(requester_id.eq.${profileId},addressee_id.eq.${targetProfileId}),and(requester_id.eq.${targetProfileId},addressee_id.eq.${profileId})`,
    );

  const { error: err } = await supabase
    .from('blocks')
    .insert({ blocker_id: profileId, blocked_id: targetProfileId });
  if (err && !String(err.message).includes('duplicate')) {
    return { ok: false, error: 'Não foi possível bloquear.' };
  }
  return { ok: true };
}

export async function unblockUser(targetProfileId: string): Promise<ActionResult> {
  const { profileId, supabase, error } = await requireProfile();
  if (!profileId || !supabase) return { ok: false, error };
  const { error: err } = await supabase
    .from('blocks')
    .delete()
    .eq('blocker_id', profileId)
    .eq('blocked_id', targetProfileId);
  if (err) return { ok: false, error: 'Não foi possível desbloquear.' };
  return { ok: true };
}
