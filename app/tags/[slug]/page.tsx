import { notFound } from 'next/navigation';
import ListingView from '@/features/posts/ListingView';
import { getTagWithPosts } from '@/features/posts/queries';
import { siteConfig } from '@/lib/config/site';
import { buildMetadata } from '@/lib/seo/metadata';

interface Props {
  params: Promise<{ slug: string }>;
}

export const revalidate = 300;

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const { tag } = await getTagWithPosts(slug, 1);
  if (!tag) return buildMetadata({ title: 'Tag', noindex: true });
  return buildMetadata({
    title: `${tag.name} — ${siteConfig.geo.city}`,
    description: `Conteúdos marcados com "${tag.name}" em ${siteConfig.geo.city}.`,
    path: `/tags/${slug}`,
  });
}

export default async function TagPage({ params }: Props) {
  const { slug } = await params;
  const { tag, posts } = await getTagWithPosts(slug);
  if (!tag) notFound();
  return <ListingView title={`#${tag.name}`} posts={posts} />;
}
