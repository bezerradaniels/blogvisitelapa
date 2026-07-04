// Construtor de metadata para o App Router (Next.js Metadata API).
import type { Metadata } from 'next';
import { absoluteUrl, getSiteUrl, siteConfig } from '@/lib/config/site';

interface BuildMetadataInput {
  title?: string;
  description?: string;
  path?: string;
  image?: string | null;
  type?: 'website' | 'article';
  noindex?: boolean;
  publishedTime?: string | null;
  modifiedTime?: string | null;
  authors?: string[];
  keywords?: string[];
}

const DEFAULT_OG = '/og-default.png';

// Monta o objeto Metadata com títulos, canonical, Open Graph e Twitter Card.
export function buildMetadata(input: BuildMetadataInput = {}): Metadata {
  const {
    title,
    description = siteConfig.description,
    path = '/',
    image,
    type = 'website',
    noindex = false,
    publishedTime,
    modifiedTime,
    authors,
    keywords,
  } = input;

  const fullTitle = title ? `${title} — ${siteConfig.name}` : `${siteConfig.name} — ${siteConfig.slogan}`;
  const canonical = absoluteUrl(path);
  const ogImage = image ?? absoluteUrl(DEFAULT_OG);

  return {
    metadataBase: new URL(getSiteUrl()),
    title: fullTitle,
    description,
    keywords,
    alternates: { canonical },
    robots: noindex
      ? { index: false, follow: false }
      : { index: true, follow: true, 'max-image-preview': 'large' },
    openGraph: {
      type,
      siteName: siteConfig.name,
      locale: 'pt_BR',
      title: fullTitle,
      description,
      url: canonical,
      images: [{ url: ogImage, width: 1200, height: 750, alt: title ?? siteConfig.name }],
      ...(type === 'article' && {
        publishedTime: publishedTime ?? undefined,
        modifiedTime: modifiedTime ?? undefined,
        authors,
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [ogImage],
    },
  };
}
