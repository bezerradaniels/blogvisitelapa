'use server';

// Server Actions da área de Comunidades.
// Criação livre por qualquer usuário logado; conteúdo (tópicos/respostas) é
// texto puro; moderação é reativa (denúncia + remoção por dono/mod/admin).
// A autorização real vive na RLS (migration 0013); aqui há checagens de apoio.
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
    return { profileId: null, supabase: null, error: 'É preciso estar logado.' as const };
  }
  const supabase = await createClient();
  return { profileId: user.profile.id, supabase, error: null };
}

// Gera slug único para comunidade (sufixa -2, -3... em caso de colisão).
async function uniqueCommunitySlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  base: string,
): Promise<string> {
  const root = slugify(base) || 'comunidade';
  let slug = root;
  for (let i = 2; i < 50; i++) {
    const { data } = await supabase.from('communities').select('id').eq('slug', slug).maybeSingle();
    if (!data) return slug;
    slug = `${root}-${i}`;
  }
  return `${root}-${Date.now()}`;
}

async function uniqueTopicSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  communityId: string,
  base: string,
): Promise<string> {
  const root = slugify(base) || 'topico';
  let slug = root;
  for (let i = 2; i < 50; i++) {
    const { data } = await supabase
      .from('community_topics')
      .select('id')
      .eq('community_id', communityId)
      .eq('slug', slug)
      .maybeSingle();
    if (!data) return slug;
    slug = `${root}-${i}`;
  }
  return `${root}-${Date.now()}`;
}

// -------------------------------------------------------------------------
// Comunidades
// -------------------------------------------------------------------------
const communitySchema = z.object({
  name: z.string().min(3, 'O nome precisa ter ao menos 3 caracteres.').max(120),
  category: z.enum([
    'cidade', 'religiosidade', 'cultura', 'esportes', 'gastronomia',
    'educacao', 'negocios', 'humor', 'outros',
  ]),
  description: z.string().max(2000).optional().default(''),
  rules: z.string().max(4000).optional().default(''),
  avatar_url: z.string().url().optional().or(z.literal('')).default(''),
  cover_image_url: z.string().url().optional().or(z.literal('')).default(''),
});

export async function createCommunity(input: z.input<typeof communitySchema>): Promise<ActionResult> {
  const { profileId, supabase, error } = await requireProfile();
  if (!profileId || !supabase) return { ok: false, error };

  const parsed = communitySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  const v = parsed.data;

  const slug = await uniqueCommunitySlug(supabase, v.name);
  const { error: err } = await supabase.from('communities').insert({
    owner_id: profileId,
    name: v.name.trim(),
    slug,
    category: v.category,
    description: v.description.trim() || null,
    rules: v.rules.trim() || null,
    avatar_url: v.avatar_url || null,
    cover_image_url: v.cover_image_url || null,
  });
  if (err) return { ok: false, error: 'Não foi possível criar a comunidade.' };

  revalidatePath('/comunidades');
  return { ok: true, slug };
}

export async function updateCommunity(
  communityId: string,
  input: z.input<typeof communitySchema>,
): Promise<ActionResult> {
  const { supabase, error } = await requireProfile();
  if (!supabase) return { ok: false, error };

  const parsed = communitySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  const v = parsed.data;

  // RLS exige dono/moderador/admin.
  const { data, error: err } = await supabase
    .from('communities')
    .update({
      name: v.name.trim(),
      category: v.category,
      description: v.description.trim() || null,
      rules: v.rules.trim() || null,
      avatar_url: v.avatar_url || null,
      cover_image_url: v.cover_image_url || null,
    })
    .eq('id', communityId)
    .select('slug')
    .maybeSingle();
  if (err || !data) return { ok: false, error: 'Não foi possível salvar as alterações.' };

  revalidatePath(`/comunidades/${data.slug}`);
  revalidatePath('/comunidades');
  return { ok: true, slug: data.slug };
}

// -------------------------------------------------------------------------
// Participação
// -------------------------------------------------------------------------
export async function joinCommunity(communityId: string): Promise<ActionResult> {
  const { profileId, supabase, error } = await requireProfile();
  if (!profileId || !supabase) return { ok: false, error };

  const { error: err } = await supabase
    .from('community_members')
    .insert({ community_id: communityId, user_id: profileId });
  // Ignora violação de unicidade (já é membro).
  if (err && !String(err.message).includes('duplicate')) {
    return { ok: false, error: 'Não foi possível entrar na comunidade.' };
  }
  revalidatePath('/comunidades');
  return { ok: true };
}

export async function leaveCommunity(communityId: string): Promise<ActionResult> {
  const { profileId, supabase, error } = await requireProfile();
  if (!profileId || !supabase) return { ok: false, error };

  const { error: err } = await supabase
    .from('community_members')
    .delete()
    .eq('community_id', communityId)
    .eq('user_id', profileId);
  if (err) return { ok: false, error: 'Não foi possível sair da comunidade.' };
  revalidatePath('/comunidades');
  return { ok: true };
}

// -------------------------------------------------------------------------
// Tópicos e respostas
// -------------------------------------------------------------------------
const topicSchema = z.object({
  title: z.string().min(3, 'O título precisa ter ao menos 3 caracteres.').max(200),
  content: z.string().min(1, 'Escreva o conteúdo do tópico.').max(10000),
});

export async function createTopic(
  communityId: string,
  input: z.input<typeof topicSchema>,
): Promise<ActionResult> {
  const { profileId, supabase, error } = await requireProfile();
  if (!profileId || !supabase) return { ok: false, error };

  const parsed = topicSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  const v = parsed.data;

  const slug = await uniqueTopicSlug(supabase, communityId, v.title);
  const { data, error: err } = await supabase
    .from('community_topics')
    .insert({
      community_id: communityId,
      author_id: profileId,
      title: v.title.trim(),
      slug,
      content: v.content.trim(),
    })
    .select('slug, community:communities!community_topics_community_id_fkey(slug)')
    .maybeSingle();
  if (err || !data) {
    return { ok: false, error: 'Não foi possível criar o tópico. Você precisa ser membro.' };
  }

  const communitySlug = (data as unknown as { community: { slug: string } | null }).community?.slug;
  if (communitySlug) revalidatePath(`/comunidades/${communitySlug}`);
  return { ok: true, slug };
}

const replySchema = z.object({
  content: z.string().min(1, 'Escreva uma resposta.').max(10000),
});

export async function createReply(
  topicId: string,
  input: z.input<typeof replySchema>,
): Promise<ActionResult> {
  const { profileId, supabase, error } = await requireProfile();
  if (!profileId || !supabase) return { ok: false, error };

  const parsed = replySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };

  const { error: err } = await supabase.from('community_replies').insert({
    topic_id: topicId,
    author_id: profileId,
    content: parsed.data.content.trim(),
  });
  if (err) {
    return { ok: false, error: 'Não foi possível responder. Verifique se é membro e se o tópico está aberto.' };
  }
  return { ok: true };
}

// -------------------------------------------------------------------------
// Denúncia (qualquer usuário logado)
// -------------------------------------------------------------------------
const reportSchema = z.object({
  targetType: z.enum(['comunidade', 'topico', 'resposta']),
  targetId: z.string().uuid(),
  reason: z.enum(['spam', 'ofensivo', 'off_topic', 'ilegal', 'outro']),
  details: z.string().max(2000).optional().default(''),
});

export async function reportContent(input: z.input<typeof reportSchema>): Promise<ActionResult> {
  const { profileId, supabase, error } = await requireProfile();
  if (!profileId || !supabase) return { ok: false, error };

  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  const v = parsed.data;

  const { error: err } = await supabase.from('community_reports').insert({
    reporter_id: profileId,
    target_type: v.targetType,
    target_id: v.targetId,
    reason: v.reason,
    details: v.details.trim() || null,
  });
  if (err) return { ok: false, error: 'Não foi possível registrar a denúncia.' };
  return { ok: true };
}

// -------------------------------------------------------------------------
// Moderação da comunidade (dono/moderador/admin — RLS reforça)
// -------------------------------------------------------------------------
export async function setTopicStatus(
  topicId: string,
  status: 'visivel' | 'removido',
): Promise<ActionResult> {
  const { supabase, error } = await requireProfile();
  if (!supabase) return { ok: false, error };
  const { error: err } = await supabase
    .from('community_topics')
    .update({ status })
    .eq('id', topicId);
  if (err) return { ok: false, error: 'Ação não permitida.' };
  revalidatePath('/comunidades');
  return { ok: true };
}

export async function setReplyStatus(
  replyId: string,
  status: 'visivel' | 'removido',
): Promise<ActionResult> {
  const { supabase, error } = await requireProfile();
  if (!supabase) return { ok: false, error };
  const { error: err } = await supabase
    .from('community_replies')
    .update({ status })
    .eq('id', replyId);
  if (err) return { ok: false, error: 'Ação não permitida.' };
  return { ok: true };
}

export async function toggleTopicLock(topicId: string, locked: boolean): Promise<ActionResult> {
  const { supabase, error } = await requireProfile();
  if (!supabase) return { ok: false, error };
  const { error: err } = await supabase
    .from('community_topics')
    .update({ is_locked: locked })
    .eq('id', topicId);
  if (err) return { ok: false, error: 'Ação não permitida.' };
  return { ok: true };
}

export async function toggleTopicPin(topicId: string, pinned: boolean): Promise<ActionResult> {
  const { supabase, error } = await requireProfile();
  if (!supabase) return { ok: false, error };
  const { error: err } = await supabase
    .from('community_topics')
    .update({ is_pinned: pinned })
    .eq('id', topicId);
  if (err) return { ok: false, error: 'Ação não permitida.' };
  return { ok: true };
}

// Promover/rebaixar membro (dono/admin). Não permite alterar o dono.
export async function setMemberRole(
  memberId: string,
  role: 'moderador' | 'membro',
): Promise<ActionResult> {
  const { supabase, error } = await requireProfile();
  if (!supabase) return { ok: false, error };
  const { error: err } = await supabase
    .from('community_members')
    .update({ role })
    .eq('id', memberId)
    .neq('role', 'dono');
  if (err) return { ok: false, error: 'Ação não permitida.' };
  return { ok: true };
}

export async function removeMember(memberId: string): Promise<ActionResult> {
  const { supabase, error } = await requireProfile();
  if (!supabase) return { ok: false, error };
  const { error: err } = await supabase
    .from('community_members')
    .delete()
    .eq('id', memberId)
    .neq('role', 'dono');
  if (err) return { ok: false, error: 'Ação não permitida.' };
  return { ok: true };
}
