import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/config/site';
import { createClient } from '@/lib/supabase/server';

// Sitemap dinâmico: rotas fixas + posts + categorias.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    '/', '/noticias', '/eventos', '/onde-comer', '/onde-malhar', '/hospedagem',
    '/religiosidade', '/comunidades', '/anuncie', '/contato', '/sobre', '/politica-editorial',
    '/politica-de-privacidade', '/politica-de-cookies', '/termos-de-uso',
  ].map((path) => ({
    url: absoluteUrl(path),
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: path === '/' ? 1 : 0.7,
  }));

  const supabase = await createClient();

  const { data: posts } = await supabase
    .from('posts')
    .select('slug, updated_at, published_at')
    .eq('status', 'publicado')
    .eq('moderation_status', 'aprovado')
    .eq('include_in_sitemap', true)
    .order('published_at', { ascending: false })
    .limit(2000);

  const { data: categories } = await supabase
    .from('categories')
    .select('slug, updated_at')
    .eq('status', 'active');
  const { data: sections } = await supabase
    .from('home_sections')
    .select('slug, updated_at')
    .eq('status', 'active')
    .is('deleted_at', null);

  const postRoutes = (posts ?? []).map((p) => ({
    url: absoluteUrl(`/post/${p.slug}`),
    lastModified: new Date(p.updated_at ?? p.published_at ?? Date.now()),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const categoryRoutes = (categories ?? []).map((c) => ({
    url: absoluteUrl(`/categorias/${c.slug}`),
    lastModified: new Date(c.updated_at ?? Date.now()),
    changeFrequency: 'daily' as const,
    priority: 0.6,
  }));
  const sectionRoutes = (sections ?? []).map((section) => ({
    url: absoluteUrl(`/secoes/${section.slug}`), lastModified: new Date(section.updated_at), changeFrequency: 'weekly' as const, priority: 0.6,
  }));

  return [...staticRoutes, ...postRoutes, ...categoryRoutes, ...sectionRoutes];
}
