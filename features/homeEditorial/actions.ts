'use server';

import { revalidatePath } from 'next/cache';
import { adminGuard } from '@/lib/auth/adminGuard';
import { homeEditorialAreas, parseHomeEditorialSlot, type HomeEditorialAreaKey } from '@/lib/config/homeEditorial';

async function ensureSections(ctx: NonNullable<Awaited<ReturnType<typeof adminGuard>>>) {
  const { data } = await ctx.supabase.from('home_sections').select('id, slug').in('slug', homeEditorialAreas.map((area) => area.slug));
  const sections = new Map((data ?? []).map((section) => [section.slug, section.id]));
  for (const [index, area] of homeEditorialAreas.entries()) {
    if (sections.has(area.slug)) continue;
    const { data: created, error } = await ctx.supabase.from('home_sections').insert({
      title: area.title, slug: area.slug, status: 'active', display_order: 900 + index,
      placement_zone: 'before-footer', selection_mode: 'manual', show_view_all: false,
      view_all_mode: 'hidden', created_by: ctx.profileId, updated_by: ctx.profileId,
    }).select('id').single();
    if (error || !created) throw new Error('Não foi possível preparar as posições da home.');
    sections.set(area.slug, created.id);
  }
  return sections;
}

export async function saveHomeEditorialSlots(input: Record<HomeEditorialAreaKey, string[]>) {
  const ctx = await adminGuard();
  if (!ctx) return { ok: false, error: 'Acesso restrito.' };
  const all = homeEditorialAreas.flatMap((area) => (input[area.key] ?? []).filter(Boolean).slice(0, area.limit));
  if (new Set(all).size !== all.length) return { ok: false, error: 'Um artigo não pode ocupar duas posições.' };
  try {
    const sections = await ensureSections(ctx);
    for (const area of homeEditorialAreas) {
      const id = sections.get(area.slug);
      if (!id) throw new Error('Seção não encontrada.');
      const postIds = (input[area.key] ?? []).filter(Boolean).slice(0, area.limit);
      const { error: deleteError } = await ctx.supabase.from('home_section_posts').delete().eq('section_id', id);
      if (deleteError) throw new Error(deleteError.message);
      if (postIds.length) {
        const { error: insertError } = await ctx.supabase.from('home_section_posts').insert(postIds.map((post_id, display_order) => ({ section_id: id, post_id, display_order })));
        if (insertError) throw new Error(insertError.message);
      }
    }
    revalidatePath('/'); revalidatePath('/admin/destaques-home');
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Não foi possível salvar as posições.' };
  }
}

export async function assignPostToHomeSlot(postId: string, slot?: string | null) {
  const ctx = await adminGuard();
  if (!ctx) return { ok: false, error: 'Acesso restrito.' };
  const target = parseHomeEditorialSlot(slot);
  try {
    const sections = await ensureSections(ctx);
    const sectionIds = [...sections.values()];
    const { data: currentLinks } = await ctx.supabase.from('home_section_posts').select('section_id, post_id, display_order').in('section_id', sectionIds).order('display_order');
    const groups = new Map(homeEditorialAreas.map((area) => [area.key, (currentLinks ?? []).filter((link) => link.section_id === sections.get(area.slug)).map((link) => link.post_id).filter((id) => id !== postId)]));
    if (target) {
      const list = groups.get(target.area.key) ?? [];
      list.splice(target.index, 0, postId);
      groups.set(target.area.key, list.slice(0, target.area.limit));
    }
    const all = Object.fromEntries(homeEditorialAreas.map((area) => [area.key, groups.get(area.key) ?? []])) as Record<HomeEditorialAreaKey, string[]>;
    for (const area of homeEditorialAreas) {
      const id = sections.get(area.slug);
      if (!id) continue;
      await ctx.supabase.from('home_section_posts').delete().eq('section_id', id);
      const ids = all[area.key];
      if (ids.length) await ctx.supabase.from('home_section_posts').insert(ids.map((post_id, display_order) => ({ section_id: id, post_id, display_order })));
    }
    revalidatePath('/'); revalidatePath('/admin/destaques-home');
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Não foi possível atualizar a posição.' };
  }
}
