// Sitemap de notícias (Google News): apenas matérias das últimas 48h.
// O Google News aceita URLs publicadas nos últimos 2 dias neste formato.
import { listPublishedPosts } from '@/features/posts/queries';
import { absoluteUrl, siteConfig } from '@/lib/config/site';

export const revalidate = 300;

const TWO_DAYS_MS = 48 * 60 * 60 * 1000;

function escapeXml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const posts = await listPublishedPosts({ contentType: 'noticia', limit: 100 });
  const cutoff = Date.now() - TWO_DAYS_MS;

  const recent = posts.filter((p) => {
    if (!p.include_in_sitemap || !p.allow_indexing) return false;
    const published = p.published_at ? new Date(p.published_at).getTime() : 0;
    return published >= cutoff;
  });

  const urls = recent
    .map((p) => {
      const loc = absoluteUrl(`/post/${p.slug}`);
      const date = new Date(p.published_at ?? p.created_at).toISOString();
      return `
  <url>
    <loc>${loc}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(siteConfig.name)}</news:name>
        <news:language>pt</news:language>
      </news:publication>
      <news:publication_date>${date}</news:publication_date>
      <news:title>${escapeXml(p.title)}</news:title>
    </news:news>
  </url>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${urls}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
