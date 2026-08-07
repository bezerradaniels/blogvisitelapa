import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { homeEditorialAreas, type HomeEditorialAreaKey, type HomeEditorialSlot } from '@/lib/config/homeEditorial';
import type { PostWithRelations } from '@/types/posts';

const POST_SELECT = '*, category:categories(id, name, slug, icon_name), author:profiles!posts_author_id_fkey(id, full_name, slug, avatar_url, role, bio)';

export async function getManualHomeEditorialPosts(): Promise<Record<HomeEditorialAreaKey, PostWithRelations[]>> {
  const supabase = await createClient();
  const result: Record<HomeEditorialAreaKey, PostWithRelations[]> = { hero: [], featured: [], secondary: [] };
  const { data: sections } = await supabase.from('home_sections').select('id, slug').in('slug', homeEditorialAreas.map((area) => area.slug)).eq('status', 'active');
  for (const area of homeEditorialAreas) {
    const section = sections?.find((item) => item.slug === area.slug);
    if (!section) continue;
    const { data } = await supabase.from('home_section_posts').select(`display_order, post:posts(${POST_SELECT})`).eq('section_id', section.id).order('display_order').limit(area.limit);
    result[area.key] = (data ?? []).flatMap((row) => row.post ? [row.post as unknown as PostWithRelations] : []);
  }
  return result;
}

export async function listHomeEditorialCandidates() {
  const supabase = await createClient();
  const { data } = await supabase.from('posts').select('id, title, slug, cover_image_url, published_at').in('status', ['rascunho', 'enviado_para_revisao', 'publicado']).eq('is_event', false).order('updated_at', { ascending: false }).limit(100);
  return data ?? [];
}

export async function getPostHomeEditorialSlot(postId: string): Promise<HomeEditorialSlot | ''> {
  const supabase = await createClient();
  const { data: sections } = await supabase.from('home_sections').select('id, slug').in('slug', homeEditorialAreas.map((area) => area.slug));
  if (!sections?.length) return '';
  const { data: link } = await supabase.from('home_section_posts').select('section_id, display_order').eq('post_id', postId).in('section_id', sections.map((section) => section.id)).maybeSingle();
  if (!link) return '';
  const section = sections.find((item) => item.id === link.section_id);
  const area = homeEditorialAreas.find((item) => item.slug === section?.slug);
  return area ? `${area.key}:${link.display_order}` : '';
}

export function resolveHomeEditorialPosts(manual: Record<HomeEditorialAreaKey, PostWithRelations[]>, recent: PostWithRelations[]) {
  const used = new Set<string>();
  const result = {} as Record<HomeEditorialAreaKey, PostWithRelations[]>;
  for (const area of homeEditorialAreas) {
    const chosen = manual[area.key].filter((post) => !used.has(post.id)).slice(0, area.limit);
    chosen.forEach((post) => used.add(post.id));
    const automatic = recent.filter((post) => !used.has(post.id)).slice(0, area.limit - chosen.length);
    automatic.forEach((post) => used.add(post.id));
    result[area.key] = [...chosen, ...automatic];
  }
  return result;
}
