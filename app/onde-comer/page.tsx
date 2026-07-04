import ListingView from '@/features/posts/ListingView';
import { listPublishedPosts } from '@/features/posts/queries';
import { sectionLandings } from '@/lib/config/landings';
import { buildMetadata } from '@/lib/seo/metadata';

const cfg = sectionLandings['onde-comer']!;

export const revalidate = 300;
export const metadata = buildMetadata({
  title: cfg.seoTitle,
  description: cfg.seoDescription,
  path: '/onde-comer',
});

export default async function OndeComerPage() {
  const posts = await listPublishedPosts({ categorySlug: 'onde-comer', limit: 24 });
  return <ListingView title={cfg.h1} description={cfg.intro} posts={posts} />;
}
