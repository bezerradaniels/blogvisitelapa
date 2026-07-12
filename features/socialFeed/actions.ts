'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

export interface SocialActionResult {
  ok: boolean;
  error?: string;
}

const postIdSchema = z.string().uuid();
const postSchema = z.string().trim().min(1, 'Escreva alguma coisa.').max(180, 'Use no máximo 180 caracteres.');

async function socialContext() {
  const user = await getCurrentUser();
  if (!user?.profile || user.profile.status !== 'active') return null;
  return { user, supabase: await createClient() };
}

function extractHashtags(content: string): string[] {
  return [...content.matchAll(/#([\p{L}\p{N}_]{1,50})/gu)]
    .map((match) => match[1]?.toLocaleLowerCase('pt-BR'))
    .filter((tag): tag is string => Boolean(tag))
    .filter((tag, index, all) => all.indexOf(tag) === index)
    .slice(0, 10);
}

function extractHandles(content: string): string[] {
  return [...content.matchAll(/@([a-z0-9][a-z0-9-]{1,59})/gi)]
    .map((match) => match[1]?.toLowerCase())
    .filter((handle): handle is string => Boolean(handle))
    .filter((handle, index, all) => all.indexOf(handle) === index)
    .slice(0, 10);
}

export async function createSocialPost(content: string): Promise<SocialActionResult> {
  const parsed = postSchema.safeParse(content);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };

  const ctx = await socialContext();
  if (!ctx) return { ok: false, error: 'Entre na sua conta para publicar.' };

  const { data: post, error } = await ctx.supabase
    .from('social_posts')
    .insert({ author_id: ctx.user.profile!.id, content: parsed.data })
    .select('id')
    .maybeSingle();
  if (error || !post) return { ok: false, error: 'Não foi possível publicar agora.' };

  const hashtags = extractHashtags(parsed.data);
  const handles = extractHandles(parsed.data);
  await Promise.all([
    hashtags.length > 0
      ? ctx.supabase.from('social_post_hashtags').insert(
          hashtags.map((tag) => ({ post_id: post.id, tag })),
        )
      : Promise.resolve(),
    handles.length > 0
      ? (async () => {
          const { data: mentioned } = await ctx.supabase
            .from('profiles')
            .select('id')
            .in('slug', handles)
            .eq('status', 'active');
          if (mentioned?.length) {
            await ctx.supabase.from('social_post_mentions').insert(
              mentioned.map((profile) => ({ post_id: post.id, profile_id: profile.id })),
            );
          }
        })()
      : Promise.resolve(),
  ]);

  revalidatePath('/rede');
  if (ctx.user.profile?.slug) revalidatePath(`/u/${ctx.user.profile.slug}`);
  return { ok: true };
}

export async function toggleSocialPostLike(postId: string): Promise<SocialActionResult> {
  if (!postIdSchema.safeParse(postId).success) return { ok: false, error: 'Post inválido.' };
  const ctx = await socialContext();
  if (!ctx) return { ok: false, error: 'Entre na sua conta para curtir.' };
  const profileId = ctx.user.profile!.id;

  const { data: existing, error: lookupError } = await ctx.supabase
    .from('social_post_likes')
    .select('post_id')
    .eq('post_id', postId)
    .eq('profile_id', profileId)
    .maybeSingle();
  if (lookupError) return { ok: false, error: 'Não foi possível atualizar a curtida.' };

  const { error } = existing
    ? await ctx.supabase
        .from('social_post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('profile_id', profileId)
    : await ctx.supabase.from('social_post_likes').insert({ post_id: postId, profile_id: profileId });
  if (error) return { ok: false, error: 'Não foi possível atualizar a curtida.' };

  revalidatePath('/rede');
  return { ok: true };
}

export async function toggleSocialPostRepost(postId: string): Promise<SocialActionResult> {
  if (!postIdSchema.safeParse(postId).success) return { ok: false, error: 'Post inválido.' };
  const ctx = await socialContext();
  if (!ctx) return { ok: false, error: 'Entre na sua conta para repostar.' };
  const profileId = ctx.user.profile!.id;

  const { data: target, error: targetError } = await ctx.supabase
    .from('social_posts')
    .select('id, repost_of')
    .eq('id', postId)
    .maybeSingle();
  if (targetError || !target) return { ok: false, error: 'Post não encontrado.' };
  const originalId = target.repost_of ?? target.id;

  const { data: existing, error: lookupError } = await ctx.supabase
    .from('social_posts')
    .select('id')
    .eq('author_id', profileId)
    .eq('repost_of', originalId)
    .maybeSingle();
  if (lookupError) return { ok: false, error: 'Não foi possível atualizar o repost.' };

  const { error } = existing
    ? await ctx.supabase.from('social_posts').delete().eq('id', existing.id)
    : await ctx.supabase.from('social_posts').insert({
        author_id: profileId,
        repost_of: originalId,
        content: null,
      });
  if (error) return { ok: false, error: 'Não foi possível atualizar o repost.' };

  revalidatePath('/rede');
  return { ok: true };
}

export async function deleteSocialPost(postId: string): Promise<SocialActionResult> {
  if (!postIdSchema.safeParse(postId).success) return { ok: false, error: 'Post inválido.' };
  const ctx = await socialContext();
  if (!ctx) return { ok: false, error: 'Acesso restrito.' };

  const { error } = await ctx.supabase.from('social_posts').delete().eq('id', postId);
  if (error) return { ok: false, error: 'Não foi possível excluir o post.' };
  revalidatePath('/rede');
  return { ok: true };
}
