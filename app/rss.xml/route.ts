// Feed RSS geral do blog.
import { listPublishedPosts } from '@/features/posts/queries';
import { siteConfig } from '@/lib/config/site';
import { buildRss } from '@/lib/seo/rss';

export const revalidate = 600;

export async function GET() {
  const posts = (await listPublishedPosts({ limit: 30 })).filter((p) => p.include_in_rss);
  const xml = buildRss(posts, {
    title: siteConfig.name,
    description: siteConfig.description,
    path: '/rss.xml',
  });
  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
