import { notFound } from 'next/navigation';
import CommunityCard from '@/components/CommunityCard';
import EmptyState from '@/components/EmptyState';
import PublicProfileShell from '@/components/PublicProfileShell';
import { listUserCommunities } from '@/features/communities/queries';
import { getPublicProfile } from '@/features/social/queries';
import { buildMetadata } from '@/lib/seo/metadata';

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return buildMetadata({ title: 'Comunidades do perfil', path: `/u/${slug}/comunidades`, noindex: true });
}

export default async function ProfileCommunitiesPage({ params }: Props) {
  const { slug } = await params;
  const profile = await getPublicProfile(slug);
  if (!profile) notFound();
  if (!profile.canView) return <PublicProfileShell profile={profile} slug={slug}><EmptyState title="Perfil restrito" /></PublicProfileShell>;
  const communities = await listUserCommunities(profile.id);
  return (
    <PublicProfileShell profile={profile} slug={slug}>
      <section className="card-base p-4 sm:p-6">
        <h1 className="mb-5 text-2xl font-extrabold text-title">Comunidades ({communities.length})</h1>
        {communities.length > 0 ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{communities.map((community) => <CommunityCard key={community.id} community={community} />)}</div> : <EmptyState title="Nenhuma comunidade" />}
      </section>
    </PublicProfileShell>
  );
}
