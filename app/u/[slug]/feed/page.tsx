import { notFound } from 'next/navigation';
import EmptyState from '@/components/EmptyState';
import PublicProfileShell from '@/components/PublicProfileShell';
import SocialPostCard from '@/features/socialFeed/SocialPostCard';
import { getProfileSocialPosts } from '@/features/socialFeed/queries';
import { getPublicProfile } from '@/features/social/queries';
import { getCurrentUser } from '@/lib/auth/session';
import { buildMetadata } from '@/lib/seo/metadata';
import { titleCase } from '@/lib/utils/format';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return buildMetadata({ title: 'Feed', path: `/u/${slug}/feed`, noindex: true });
}

export default async function PublicProfileFeedPage({ params }: Props) {
  const { slug } = await params;
  const [profile, viewer] = await Promise.all([getPublicProfile(slug), getCurrentUser()]);
  if (!profile) notFound();

  if (!profile.canView) {
    return (
      <PublicProfileShell profile={profile} slug={slug}>
        <EmptyState title="Perfil restrito" description="As atualizações deste perfil não estão disponíveis." />
      </PublicProfileShell>
    );
  }

  const posts = await getProfileSocialPosts(profile.id, viewer?.profile?.id ?? null, 50);

  return (
    <PublicProfileShell profile={profile} slug={slug}>
      <section className="space-y-4">
        <div className="card-base p-4 sm:p-6">
          <h1 className="text-2xl font-extrabold text-title">Feed</h1>
          <p className="mt-1 text-sm text-muted">Atualizações publicadas por {profile.details?.nickname ?? (titleCase(profile.full_name) || 'este usuário')}.</p>
        </div>

        {posts.length > 0 ? (
          posts.map((post) => (
            <SocialPostCard
              key={post.id}
              post={post}
              isLogged={Boolean(viewer)}
              loginRedirect={`/u/${slug}/feed`}
            />
          ))
        ) : (
          <EmptyState title="Nenhuma atualização publicada ainda" />
        )}
      </section>
    </PublicProfileShell>
  );
}
