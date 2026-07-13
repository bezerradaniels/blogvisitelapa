import 'server-only';

// Consultas de posts para o site público (Server Components).
// RLS garante que só posts publicados/aprovados apareçam ao público.
import { createClient } from '@/lib/supabase/server';
import type { NewsFilterCategory } from '@/features/posts/NewsFilterSidebar';
import type { PostWithRelations } from '@/types/posts';
import type { ContentType } from '@/types/database';

// Seleção padrão com categoria e autor embutidos.
const POST_SELECT = `
  *,
  category:categories(id, name, slug, icon_name),
  author:profiles!posts_author_id_fkey(id, full_name, slug, avatar_url, role, bio)
`;

type PostRow = Record<string, unknown>;

function mapPost(row: PostRow): PostWithRelations {
  return row as unknown as PostWithRelations;
}

interface ListOptions {
  limit?: number;
  offset?: number;
  categorySlug?: string;
  contentType?: ContentType;
  featured?: boolean;
  excludeId?: string;
}

// Lista posts publicados, mais recentes primeiro.
export async function listPublishedPosts(options: ListOptions = {}): Promise<PostWithRelations[]> {
  const { limit = 12, offset = 0, categorySlug, contentType, featured, excludeId } = options;
  const supabase = await createClient();

  let query = supabase
    .from('posts')
    .select(POST_SELECT)
    .eq('status', 'publicado')
    .eq('moderation_status', 'aprovado')
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (contentType) query = query.eq('content_type', contentType);
  if (featured) query = query.eq('is_featured', true);
  if (excludeId) query = query.neq('id', excludeId);
  if (categorySlug) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .single();
    if (!cat) return [];
    query = query.eq('category_id', cat.id);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data.map(mapPost);
}

// Busca um post publicado pelo slug (para a página de detalhe).
export async function getPostBySlug(slug: string): Promise<PostWithRelations | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .eq('slug', slug)
    .eq('status', 'publicado')
    .eq('moderation_status', 'aprovado')
    .maybeSingle();
  if (error || !data) return null;
  return mapPost(data);
}

// Posts mais lidos (por views).
export async function listMostReadPosts(limit = 5): Promise<PostWithRelations[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .eq('status', 'publicado')
    .eq('moderation_status', 'aprovado')
    .order('views_count', { ascending: false })
    .limit(limit);
  return (data ?? []).map(mapPost);
}

// Próximos eventos (ordenados pela data de início).
export async function listUpcomingEvents(limit = 6): Promise<PostWithRelations[]> {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();
  const { data } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .eq('status', 'publicado')
    .eq('moderation_status', 'aprovado')
    .eq('is_event', true)
    .gte('event_start_date', nowIso)
    .order('event_start_date', { ascending: true })
    .limit(limit);
  return (data ?? []).map(mapPost);
}

// Busca uma categoria ativa pelo slug.
export async function getCategoryBySlug(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle();
  return data;
}

// Busca uma tag pelo slug e seus posts publicados.
export async function getTagWithPosts(slug: string, limit = 24) {
  const supabase = await createClient();
  const { data: tag } = await supabase.from('tags').select('*').eq('slug', slug).maybeSingle();
  if (!tag) return { tag: null, posts: [] as PostWithRelations[] };

  const { data: links } = await supabase
    .from('post_tags')
    .select('post_id')
    .eq('tag_id', tag.id)
    .limit(limit);

  const ids = (links ?? []).map((l) => l.post_id);
  if (ids.length === 0) return { tag, posts: [] as PostWithRelations[] };

  const { data: posts } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .in('id', ids)
    .eq('status', 'publicado')
    .eq('moderation_status', 'aprovado')
    .order('published_at', { ascending: false });

  return { tag, posts: (posts ?? []).map(mapPost) };
}

// Busca de posts por texto (título/subtítulo/resumo).
export async function searchPosts(term: string, limit = 24): Promise<PostWithRelations[]> {
  const clean = term.trim();
  if (!clean) return [];
  const supabase = await createClient();
  const pattern = `%${clean}%`;
  const { data } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .eq('status', 'publicado')
    .eq('moderation_status', 'aprovado')
    .or(`title.ilike.${pattern},subtitle.ilike.${pattern},excerpt.ilike.${pattern}`)
    .order('published_at', { ascending: false })
    .limit(limit);
  return (data ?? []).map(mapPost);
}

// Posts relacionados (mesma categoria, exceto o atual).
export async function listRelatedPosts(
  post: PostWithRelations,
  limit = 3,
): Promise<PostWithRelations[]> {
  const supabase = await createClient();
  let query = supabase
    .from('posts')
    .select(POST_SELECT)
    .eq('status', 'publicado')
    .eq('moderation_status', 'aprovado')
    .neq('id', post.id)
    .order('published_at', { ascending: false })
    .limit(limit);
  if (post.category_id) query = query.eq('category_id', post.category_id);
  const { data } = await query;
  return (data ?? []).map(mapPost);
}

// Registra uma visualização do post (RPC segura).
export async function registerPostView(postId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc('register_post_view', { p_post_id: postId });
}

// Rótulo de patrocínio ativo do post (se houver).
export async function getSponsorLabel(postId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.rpc('get_sponsor_label', { p_post_id: postId });
  return data ?? null;
}

// Categorias do carrossel fixo da home.
export async function listCarouselCategories() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('categories')
    .select('id, name, slug, description, icon_name, image_url')
    .eq('is_fixed_carousel_item', true)
    .eq('status', 'active')
    .order('sort_order', { ascending: true });
  return data ?? [];
}

// Categorias exibidas como filtro da página de notícias.
export async function listNewsFilterCategories(): Promise<NewsFilterCategory[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('categories')
    .select('id, name, slug, icon_name')
    .eq('status', 'active')
    .order('sort_order', { ascending: true });
  return (data ?? []) as NewsFilterCategory[];
}
