import Link from 'next/link';
import { notFound } from 'next/navigation';
import EmptyState from '@/components/EmptyState';
import PublicProfileShell from '@/components/PublicProfileShell';
import DeleteScrapButton from '@/features/social/DeleteScrapButton';
import InteractionGate from '@/features/social/InteractionGate';
import ScrapForm from '@/features/social/ScrapForm';
import { getFriendState, getPublicProfile, listScraps } from '@/features/social/queries';
import { getCurrentUser } from '@/lib/auth/session';
import { buildMetadata } from '@/lib/seo/metadata';
import { timeAgo, titleCase } from '@/lib/utils/format';

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return buildMetadata({ title: 'Recados', path: `/u/${slug}/recados`, noindex: true });
}

export default async function ProfileScrapsPage({ params }: Props) {
  const { slug } = await params;
  const [profile, viewer] = await Promise.all([getPublicProfile(slug), getCurrentUser()]);
  if (!profile) notFound();
  if (!profile.canView) return <PublicProfileShell profile={profile} slug={slug}><EmptyState title="Perfil restrito" /></PublicProfileShell>;
  const [scraps, friendState] = await Promise.all([
    listScraps(profile.id),
    getFriendState(profile.id, viewer?.profile?.id ?? null),
  ]);
  const isOwner = friendState === 'self';
  return (
    <PublicProfileShell profile={profile} slug={slug}>
      <section className="card-base p-4 sm:p-6">
        <h1 className="mb-5 text-2xl font-extrabold text-title">Recados</h1>
        {friendState === 'friends' && <div className="mb-5"><ScrapForm profileId={profile.id} /></div>}
        {friendState !== 'friends' && friendState !== 'self' && (
          <div className="mb-5">
            <InteractionGate
              kind="recado"
              isLogged={Boolean(viewer)}
              friendState={friendState}
              targetProfileId={profile.id}
              targetSlug={slug}
              targetName={profile.details?.nickname ?? (titleCase(profile.full_name) || 'este usuário')}
            />
          </div>
        )}
        {scraps.length > 0 ? (
          <ul className="divide-y divide-line">
            {scraps.map((scrap) => (
              <li key={scrap.id} className="flex gap-3 py-4 first:pt-0 last:pb-0">
                {scrap.author?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={scrap.author.avatar_url} alt="" className="h-11 w-11 rounded-full object-cover" />
                ) : <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-soft font-bold text-brand-dark">{(scrap.author?.full_name ?? 'U').charAt(0)}</span>}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                    <Link href={`/u/${scrap.author?.slug}`} className="font-bold text-brand hover:underline">{titleCase(scrap.author?.full_name) || 'Usuário'}</Link>
                    <span>{timeAgo(scrap.created_at)}</span>
                    {(isOwner || scrap.author?.id === viewer?.profile?.id) && <span className="ml-auto"><DeleteScrapButton scrapId={scrap.id} /></span>}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-body">{scrap.content}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : <EmptyState title="Nenhum recado ainda" />}
      </section>
    </PublicProfileShell>
  );
}
