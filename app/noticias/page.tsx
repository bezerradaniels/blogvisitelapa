import ListingView from '@/features/posts/ListingView';
import { listPublishedPosts } from '@/features/posts/queries';
import { sectionLandings } from '@/lib/config/landings';
import { buildMetadata } from '@/lib/seo/metadata';

const cfg = sectionLandings.noticias!;

export const revalidate = 120;
export const metadata = buildMetadata({
  title: cfg.seoTitle,
  description: cfg.seoDescription,
  path: '/noticias',
});

export default async function NoticiasPage() {
  const posts = await listPublishedPosts({ contentType: 'noticia', limit: 24 });
  return <ListingView title={cfg.h1} description={cfg.intro} posts={posts} />;
}
