// Rota legada mantida para assinantes; o conteúdo agora reúne todos os artigos.
import { listPublishedPosts } from '@/features/posts/queries';
import { siteConfig } from '@/lib/config/site';
import { buildRss } from '@/lib/seo/rss';

export const revalidate = 300;

export async function GET() {
  const posts = (await listPublishedPosts({ limit: 30 })).filter(
    (p) => p.include_in_rss,
  );
  const xml = buildRss(posts, {
    title: `${siteConfig.name} — Artigos`,
    description: `Artigos recentes sobre ${siteConfig.geo.city}, ${siteConfig.geo.stateCode}.`,
    path: '/feed/noticias',
  });
  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
