import ListingView from '@/features/posts/ListingView';
import { listUpcomingEvents } from '@/features/posts/queries';
import { sectionLandings } from '@/lib/config/landings';
import { buildMetadata } from '@/lib/seo/metadata';

const cfg = sectionLandings.eventos!;

export const revalidate = 120;
export const metadata = buildMetadata({
  title: cfg.seoTitle,
  description: cfg.seoDescription,
  path: '/eventos',
});

export default async function EventosPage() {
  const posts = await listUpcomingEvents(24);
  return (
    <ListingView
      title={cfg.h1}
      description={cfg.intro}
      posts={posts}
      emptyTitle="Nenhum evento agendado"
    />
  );
}
