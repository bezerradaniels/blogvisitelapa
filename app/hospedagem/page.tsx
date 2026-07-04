import ListingView from '@/features/posts/ListingView';
import { listPublishedPosts } from '@/features/posts/queries';
import { sectionLandings } from '@/lib/config/landings';
import { buildMetadata } from '@/lib/seo/metadata';

const cfg = sectionLandings.hospedagem!;

export const revalidate = 300;
export const metadata = buildMetadata({
  title: cfg.seoTitle,
  description: cfg.seoDescription,
  path: '/hospedagem',
});

export default async function HospedagemPage() {
  const posts = await listPublishedPosts({ categorySlug: 'hospedagem', limit: 24 });
  return <ListingView title={cfg.h1} description={cfg.intro} posts={posts} />;
}
