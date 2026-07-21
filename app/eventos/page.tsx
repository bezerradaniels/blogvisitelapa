import ListingView from '@/features/posts/ListingView';
import EventSubmissionModal from '@/features/events/EventSubmissionModal';
import { listUpcomingEvents } from '@/features/posts/queries';
import { getCurrentUser } from '@/lib/auth/session';
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
  const [posts, user] = await Promise.all([listUpcomingEvents(24), getCurrentUser()]);
  return (
    <ListingView
      title={cfg.h1}
      description={cfg.intro}
      posts={posts}
      emptyTitle="Nenhum evento agendado"
      headerAction={<EventSubmissionModal isAuthenticated={Boolean(user)} />}
    />
  );
}
