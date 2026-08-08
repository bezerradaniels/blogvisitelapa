import ListingView from '@/features/posts/ListingView';
import EventSubmissionModal from '@/features/events/EventSubmissionModal';
import EventFilterSidebar from '@/features/events/EventFilterSidebar';
import { listNewsFilterCategories, listUpcomingEvents, type EventPeriod } from '@/features/posts/queries';
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

interface EventosPageProps {
  searchParams: Promise<{ periodo?: string; categoria?: string; local?: string }>;
}

const eventPeriods = new Set<EventPeriod>(['today', 'weekend', '7-days', '30-days']);

export default async function EventosPage({ searchParams }: EventosPageProps) {
  const params = await searchParams;
  const period = eventPeriods.has(params.periodo as EventPeriod) ? params.periodo as EventPeriod : undefined;
  const category = params.categoria?.trim() || undefined;
  const location = params.local?.trim().slice(0, 80) || undefined;
  const [posts, user, categories] = await Promise.all([
    listUpcomingEvents({ limit: 48, period, categorySlug: category, location }),
    getCurrentUser(),
    listNewsFilterCategories(),
  ]);
  return (
    <ListingView
      title={cfg.h1}
      description={cfg.intro}
      posts={posts}
      sidebar={<EventFilterSidebar categories={categories} activePeriod={period} activeCategory={category} location={location} />}
      emptyTitle={period || category || location ? 'Nenhum evento encontrado com estes filtros' : 'Nenhum evento agendado'}
      headerAction={<EventSubmissionModal isAuthenticated={Boolean(user)} />}
    />
  );
}
