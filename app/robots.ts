import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/config/site';

// robots.txt — permite o conteúdo público e aponta o sitemap principal.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/publisher', '/perfil', '/favoritos', '/api/'],
      },
    ],
    sitemap: [absoluteUrl('/sitemap.xml')],
    host: absoluteUrl('/'),
  };
}
