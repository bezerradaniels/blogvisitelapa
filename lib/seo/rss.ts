// Gerador de RSS 2.0 (com namespaces básicos).
import { absoluteUrl, siteConfig } from '@/lib/config/site';
import type { PostWithRelations } from '@/types/posts';

function escapeXml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

interface FeedOptions {
  title: string;
  description: string;
  path: string;
}

export function buildRss(posts: PostWithRelations[], options: FeedOptions): string {
  const items = posts
    .map((post) => {
      const url = absoluteUrl(`/post/${post.slug}`);
      const date = new Date(post.published_at ?? post.created_at).toUTCString();
      const image = post.cover_image_url
        ? `<enclosure url="${escapeXml(post.cover_image_url)}" type="image/jpeg" />`
        : '';
      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${date}</pubDate>
      ${post.author?.full_name ? `<dc:creator>${escapeXml(post.author.full_name)}</dc:creator>` : ''}
      ${post.category ? `<category>${escapeXml(post.category.name)}</category>` : ''}
      <description>${escapeXml(post.excerpt ?? post.subtitle ?? '')}</description>
      ${image}
    </item>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(options.title)}</title>
    <link>${absoluteUrl(options.path)}</link>
    <description>${escapeXml(options.description)}</description>
    <language>pt-BR</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>${escapeXml(siteConfig.name)}</generator>${items}
  </channel>
</rss>`;
}
