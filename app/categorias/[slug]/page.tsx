import { notFound } from 'next/navigation';
import ListingView from '@/features/posts/ListingView';
import { getCategoryBySlug, listPublishedPosts } from '@/features/posts/queries';
import { siteConfig } from '@/lib/config/site';
import { buildMetadata } from '@/lib/seo/metadata';

interface Props {
  params: Promise<{ slug: string }>;
}

export const revalidate = 300;

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return buildMetadata({ title: 'Categoria', noindex: true });
  return buildMetadata({
    title: `${category.name} em ${siteConfig.geo.city}`,
    description:
      category.description ??
      `Conteúdos de ${category.name} em ${siteConfig.geo.city}, ${siteConfig.geo.stateCode}.`,
    path: `/categorias/${slug}`,
  });
}

export default async function CategoriaPage({ params }: Props) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const posts = await listPublishedPosts({ categorySlug: slug, limit: 24 });
  return (
    <ListingView
      title={`${category.name} em ${siteConfig.geo.city}`}
      description={category.description ?? undefined}
      posts={posts}
    />
  );
}
