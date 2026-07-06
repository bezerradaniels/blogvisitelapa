// Geradores de dados estruturados (JSON-LD) para SEO / Google News / Discover.
import { absoluteUrl, siteConfig } from '@/lib/config/site';
import type { PostWithRelations } from '@/types/posts';

type JsonLd = Record<string, unknown>;

// Organization + WebSite (colocados no layout raiz).
export function organizationSchema(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsMediaOrganization',
    name: siteConfig.name,
    url: absoluteUrl('/'),
    logo: absoluteUrl('/logo.png'),
    slogan: siteConfig.slogan,
    areaServed: {
      '@type': 'City',
      name: siteConfig.geo.city,
      address: {
        '@type': 'PostalAddress',
        addressLocality: siteConfig.geo.city,
        addressRegion: siteConfig.geo.stateCode,
        addressCountry: siteConfig.geo.countryCode,
      },
    },
  };
}

export function websiteSchema(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: absoluteUrl('/'),
    inLanguage: 'pt-BR',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${absoluteUrl('/busca')}?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

// Breadcrumbs.
export function breadcrumbSchema(items: { name: string; path: string }[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

// Article / NewsArticle conforme o tipo do post.
export function articleSchema(post: PostWithRelations): JsonLd {
  const isNews = post.content_type === 'noticia';
  const url = absoluteUrl(`/post/${post.slug}`);

  return {
    '@context': 'https://schema.org',
    '@type': isNews ? 'NewsArticle' : 'Article',
    headline: post.seo_title ?? post.title,
    description: post.seo_description ?? post.excerpt ?? undefined,
    image: post.cover_image_url ? [post.cover_image_url] : undefined,
    datePublished: post.published_at ?? post.created_at,
    dateModified: post.updated_at,
    author: post.author
      ? {
          '@type': 'Person',
          name: post.author.full_name ?? 'Redação',
          url: post.author.slug ? absoluteUrl(`/autor/${post.author.slug}`) : undefined,
        }
      : { '@type': 'Organization', name: siteConfig.name },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      logo: { '@type': 'ImageObject', url: absoluteUrl('/logo.png') },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    articleSection: post.category?.name ?? undefined,
    keywords: [post.focus_keyword, post.local_seo_keyword].filter(Boolean).join(', ') || undefined,
    inLanguage: 'pt-BR',
    contentLocation: {
      '@type': 'Place',
      name: `${siteConfig.geo.city}, ${siteConfig.geo.stateCode}`,
    },
  };
}

// Event (para posts de evento).
export function eventSchema(post: PostWithRelations): JsonLd | null {
  if (!post.is_event || !post.event_start_date) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: post.title,
    description: post.excerpt ?? post.seo_description ?? undefined,
    startDate: post.event_start_date,
    endDate: post.event_end_date ?? undefined,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    image: post.cover_image_url ? [post.cover_image_url] : undefined,
    location: {
      '@type': 'Place',
      name: post.event_location ?? siteConfig.geo.city,
      address: {
        '@type': 'PostalAddress',
        streetAddress: post.event_address ?? undefined,
        addressLocality: siteConfig.geo.city,
        addressRegion: siteConfig.geo.stateCode,
        addressCountry: siteConfig.geo.countryCode,
      },
    },
    organizer: post.event_organizer
      ? { '@type': 'Organization', name: post.event_organizer }
      : undefined,
    offers: post.event_ticket_url
      ? { '@type': 'Offer', url: post.event_ticket_url, availability: 'https://schema.org/InStock' }
      : undefined,
  };
}
