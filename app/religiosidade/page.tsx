import ListingView from '@/features/posts/ListingView';
import { listPublishedPosts } from '@/features/posts/queries';
import { sectionLandings } from '@/lib/config/landings';
import { buildMetadata } from '@/lib/seo/metadata';

const cfg = sectionLandings.religiosidade!;

export const revalidate = 300;
export const metadata = buildMetadata({
  title: cfg.seoTitle,
  description: cfg.seoDescription,
  path: '/religiosidade',
});

export default async function ReligiosidadePage() {
  const posts = await listPublishedPosts({ categorySlug: 'religiosidade', limit: 24 });
  return <ListingView title={cfg.h1} description={cfg.intro} posts={posts} />;
}
