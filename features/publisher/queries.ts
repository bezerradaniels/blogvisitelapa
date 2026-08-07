import 'server-only';

// Consultas de apoio ao painel do publisher.
import { createClient } from '@/lib/supabase/server';
import type { PostFormInitial } from '@/features/publisher/PostForm';
import { isPortalSectionTag, portalSections, portalSectionTag } from '@/lib/config/portalSections';

export async function listActiveCategories() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('categories')
    .select('id, name, slug, parent_id')
    .eq('status', 'active')
    .order('sort_order', { ascending: true });
  return data ?? [];
}

// Carrega um post para edição (com galeria e tags formatadas para o form).
export async function getPostForEdit(id: string): Promise<PostFormInitial | null> {
  const supabase = await createClient();
  const { data: post } = await supabase.from('posts').select('*').eq('id', id).maybeSingle();
  if (!post) return null;

  const [{ data: gallery }, { data: tagLinks }] = await Promise.all([
    supabase.from('post_gallery').select('url, alt').eq('post_id', id).order('sort_order'),
    supabase.from('post_tags').select('tags(name, slug)').eq('post_id', id),
  ]);

  const linkedTags = (tagLinks ?? [])
    .map((row) => (row as unknown as { tags: { name: string; slug: string } | null }).tags)
    .filter((tag): tag is { name: string; slug: string } => Boolean(tag));
  const tags = linkedTags
    .filter((tag) => !isPortalSectionTag(tag.slug))
    .map((tag) => tag.name)
    .filter(Boolean)
    .join(', ');
  const selectedPortalSections = portalSections
    .filter((section) => linkedTags.some((tag) => tag.slug === portalSectionTag(section.value)))
    .map((section) => section.value);

  return {
    id: post.id,
    title: post.title,
    subtitle: post.subtitle ?? '',
    slug: post.slug,
    excerpt: post.excerpt ?? '',
    content_html: post.content_html ?? '',
    content_json: post.content_json ?? undefined,
    cover_image_url: post.cover_image_url ?? '',
    cover_image_alt: post.cover_image_alt ?? '',
    category_id: post.category_id ?? '',
    content_type: post.content_type,
    tags,
    portal_sections: selectedPortalSections,
    is_featured: post.is_featured,
    is_sponsored: post.is_sponsored,
    is_event: post.is_event,
    event_start_date: toLocalInput(post.event_start_date),
    event_end_date: toLocalInput(post.event_end_date),
    event_location: post.event_location ?? '',
    event_address: post.event_address ?? '',
    event_ticket_url: post.event_ticket_url ?? '',
    event_organizer: post.event_organizer ?? '',
    event_map_url: post.event_map_url ?? '',
    event_is_free: post.event_is_free,
    source_note: post.source_note ?? '',
    editorial_notes: post.editorial_notes ?? '',
    seo_title: post.seo_title ?? '',
    seo_description: post.seo_description ?? '',
    focus_keyword: post.focus_keyword ?? '',
    local_seo_keyword: post.local_seo_keyword ?? '',
    social_title: post.social_title ?? '',
    social_description: post.social_description ?? '',
    social_image_url: post.social_image_url ?? '',
    allow_indexing: post.allow_indexing,
    include_in_sitemap: post.include_in_sitemap,
    include_in_rss: post.include_in_rss,
    galleryItems: (gallery ?? []).map((g) => ({ url: g.url, alt: g.alt ?? '' })),
    currentStatus: post.status,
  };
}

// Converte timestamptz para o formato do input datetime-local (YYYY-MM-DDTHH:mm).
function toLocalInput(value: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
