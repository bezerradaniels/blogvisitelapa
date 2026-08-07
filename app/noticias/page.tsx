import ListingView from '@/features/posts/ListingView';
import NewsExploreSidebar from '@/features/posts/NewsExploreSidebar';
import NewsFilterDisclosure from '@/features/posts/NewsFilterDisclosure';
import { listNewsFilterCategories, listPublishedPosts } from '@/features/posts/queries';
import { sectionLandings } from '@/lib/config/landings';
import { buildMetadata } from '@/lib/seo/metadata';

const cfg = sectionLandings.noticias!;

export const revalidate = 120;
export const metadata = buildMetadata({
  title: cfg.seoTitle,
  description: cfg.seoDescription,
  path: '/noticias',
});

interface NoticiasPageProps {
  searchParams: Promise<{ categoria?: string }>;
}

export default async function NoticiasPage({ searchParams }: NoticiasPageProps) {
  const { categoria } = await searchParams;
  const requestedCategory = categoria?.trim() || undefined;
  const categories = await listNewsFilterCategories();
  const newsCategories = categories.filter((category) => category.slug !== cfg.slug);
  const activeCategory = newsCategories.some((category) => category.slug === requestedCategory) ? requestedCategory : undefined;
  const posts = await listPublishedPosts({ categorySlug: activeCategory, isEvent: false, limit: 24 });
  return (
    <ListingView
      title={cfg.h1}
      description={cfg.intro}
      posts={posts}
      rightSidebar={<NewsExploreSidebar filter={<NewsFilterDisclosure categories={newsCategories} activeCategory={activeCategory} />} />}
      emptyTitle={activeCategory ? 'Nenhum artigo nesta categoria' : undefined}
      showSubtitles
      cardVariant="editorial-grid"
    />
  );
}
