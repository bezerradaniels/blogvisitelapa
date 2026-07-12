import 'server-only';

import { createClient } from '@/lib/supabase/server';
import type { HomeSection, HomeSectionPlacementZone, HomeSectionWithPosts } from '@/types/homeSections';
import type { PostWithRelations } from '@/types/posts';

const POST_SELECT = '*, category:categories(id, name, slug, icon_name), author:profiles!posts_author_id_fkey(id, full_name, slug, avatar_url, role, bio)';
const SECTION_SELECT = 'id, title, subtitle, description, slug, status, display_order, placement_zone, selection_mode, show_view_all, view_all_mode, custom_view_all_url, cover_image_url, cover_image_alt, automatic_rules, created_by, updated_by, created_at, updated_at, deleted_at';

function mapSection(row: unknown): HomeSection { return row as HomeSection; }
function mapPost(row: unknown): PostWithRelations { return row as PostWithRelations; }

export async function listAdminHomeSections(): Promise<HomeSection[]> {
  const supabase = await createClient();
  const { data } = await supabase.from('home_sections').select(SECTION_SELECT).is('deleted_at', null).order('display_order').order('created_at', { ascending: false });
  return (data ?? []).map(mapSection);
}

async function resolveManualSectionPosts(sectionId: string, limit?: number): Promise<PostWithRelations[]> {
  const supabase = await createClient();
  let query = supabase.from('home_section_posts').select(`display_order, post:posts(${POST_SELECT})`).eq('section_id', sectionId).order('display_order');
  if (limit) query = query.limit(limit);
  const { data } = await query;
  return (data ?? []).flatMap((row) => row.post ? [mapPost(row.post)] : []);
}

// Ponto único de resolução: o modo automático fica preparado para uma futura implementação.
export async function resolveHomeSectionPosts(section: HomeSection, limit?: number): Promise<PostWithRelations[]> {
  if (section.selection_mode !== 'manual') return [];
  return resolveManualSectionPosts(section.id, limit);
}

export async function listPublicHomeSections(zone: HomeSectionPlacementZone): Promise<HomeSectionWithPosts[]> {
  const supabase = await createClient();
  const { data } = await supabase.from('home_sections').select(SECTION_SELECT).eq('status', 'active').eq('placement_zone', zone).is('deleted_at', null).order('display_order');
  const sections = (data ?? []).map(mapSection);
  const resolved = await Promise.all(sections.map(async (section) => ({ ...section, posts: await resolveHomeSectionPosts(section, 12) })));
  return resolved.filter((section) => section.posts.length > 0);
}

export async function getPublicHomeSection(slug: string): Promise<HomeSectionWithPosts | null> {
  const supabase = await createClient();
  const { data } = await supabase.from('home_sections').select(SECTION_SELECT).eq('slug', slug).eq('status', 'active').is('deleted_at', null).maybeSingle();
  if (!data) return null;
  const section = mapSection(data);
  const posts = await resolveHomeSectionPosts(section);
  return posts.length ? { ...section, posts } : null;
}

export async function listHomeSectionPostsForAdmin(sectionId: string): Promise<PostWithRelations[]> {
  return resolveManualSectionPosts(sectionId);
}
