'use server';

import { revalidatePath } from 'next/cache';
import { adminGuard } from '@/lib/auth/adminGuard';
import { slugify } from '@/lib/utils/format';
import { homeSectionSchema, type HomeSectionInput } from './validation';

function invalidate(slug?: string) {
  revalidatePath('/'); revalidatePath('/admin/secoes-home'); revalidatePath('/sitemap.xml');
  if (slug) revalidatePath(`/secoes/${slug}`);
}

export async function saveHomeSection(input: HomeSectionInput) {
  const ctx = await adminGuard();
  if (!ctx) return { ok: false, error: 'Acesso restrito.' };
  const parsed = homeSectionSchema.safeParse({ ...input, slug: slugify(input.slug || input.title) });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  const d = parsed.data;
  if (d.selection_mode === 'automatic') return { ok: false, error: 'A seleção automática ainda não está disponível.' };
  const payload = {
    title: d.title, subtitle: d.subtitle || null, description: d.description || null, slug: d.slug,
    status: d.status, display_order: d.display_order, placement_zone: d.placement_zone,
    selection_mode: d.selection_mode, show_view_all: d.show_view_all && d.view_all_mode !== 'hidden',
    view_all_mode: d.view_all_mode, custom_view_all_url: d.view_all_mode === 'custom' ? d.custom_view_all_url || null : null,
    cover_image_url: d.cover_image_url || null, cover_image_alt: d.cover_image_alt || null, updated_by: ctx.profileId,
  };
  const result = d.id
    ? await ctx.supabase.from('home_sections').update(payload).eq('id', d.id).select('id, slug').single()
    : await ctx.supabase.from('home_sections').insert({ ...payload, created_by: ctx.profileId }).select('id, slug').single();
  if (result.error || !result.data) return { ok: false, error: result.error?.code === '23505' ? 'Este slug já está em uso.' : 'Não foi possível salvar a seção.' };
  const { error: postsError } = await ctx.supabase.rpc('replace_home_section_posts', { p_section_id: result.data.id, p_post_ids: d.post_ids });
  if (postsError) return { ok: false, error: postsError.message };
  invalidate(result.data.slug); return { ok: true, id: result.data.id };
}

export async function deleteHomeSection(id: string) {
  const ctx = await adminGuard(); if (!ctx) return { ok: false, error: 'Acesso restrito.' };
  const { data, error } = await ctx.supabase.from('home_sections').update({ deleted_at: new Date().toISOString(), status: 'inactive', updated_by: ctx.profileId }).eq('id', id).select('slug').single();
  if (error) return { ok: false, error: 'Não foi possível excluir a seção.' }; invalidate(data.slug); return { ok: true };
}

export async function duplicateHomeSection(id: string) {
  const ctx = await adminGuard(); if (!ctx) return { ok: false, error: 'Acesso restrito.' };
  const { data: source } = await ctx.supabase.from('home_sections').select('*').eq('id', id).is('deleted_at', null).single();
  if (!source) return { ok: false, error: 'Seção não encontrada.' };
  const { data: links } = await ctx.supabase.from('home_section_posts').select('post_id').eq('section_id', id).order('display_order');
  let suffix = 2; let slug = `${source.slug}-copia`;
  while ((await ctx.supabase.from('home_sections').select('id').eq('slug', slug).maybeSingle()).data) slug = `${source.slug}-copia-${suffix++}`;
  const { data: copy, error } = await ctx.supabase.from('home_sections').insert({ ...source, id: undefined, title: `${source.title} (cópia)`, slug, status: 'inactive', created_by: ctx.profileId, updated_by: ctx.profileId, deleted_at: null, created_at: undefined, updated_at: undefined }).select('id, slug').single();
  if (error || !copy) return { ok: false, error: 'Não foi possível duplicar a seção.' };
  const { error: postsError } = await ctx.supabase.rpc('replace_home_section_posts', { p_section_id: copy.id, p_post_ids: (links ?? []).map((link) => link.post_id) });
  if (postsError) return { ok: false, error: postsError.message }; invalidate(copy.slug); return { ok: true };
}

export async function searchEligibleSectionPosts(term: string) {
  const ctx = await adminGuard(); if (!ctx) return { ok: false, error: 'Acesso restrito.', posts: [] };
  const clean = term.trim();
  let query = ctx.supabase.from('posts').select('id, title, slug, cover_image_url, cover_image_alt, published_at, status, moderation_status, category:categories(name), author:profiles!posts_author_id_fkey(full_name)').eq('status', 'publicado').eq('moderation_status', 'aprovado').lte('published_at', new Date().toISOString()).order('published_at', { ascending: false }).limit(30);
  if (clean) query = query.ilike('title', `%${clean}%`);
  const { data, error } = await query; return { ok: !error, error: error ? 'Não foi possível buscar os posts.' : undefined, posts: data ?? [] };
}
