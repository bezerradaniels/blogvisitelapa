import Link from 'next/link';
import { redirect } from 'next/navigation';
import EmptyState from '@/components/EmptyState';
import SocialPostCard from '@/features/socialFeed/SocialPostCard';
import SocialPostComposer from '@/features/socialFeed/SocialPostComposer';
import { getSocialFeed, getSocialFeedSidebar } from '@/features/socialFeed/queries';
import { getCurrentUser } from '@/lib/auth/session';
import { buildMetadata } from '@/lib/seo/metadata';

export const dynamic = 'force-dynamic';
export const metadata = buildMetadata({ title: 'Feed da Rede Social', path: '/rede', noindex: true });

interface Props {
  searchParams: Promise<{ hashtag?: string }>;
}

export default async function RedeSocialPage({ searchParams }: Props) {
  const { hashtag } = await searchParams;
  const user = await getCurrentUser();
  if (!user?.profile) redirect('/login-rede-social?redirect=/rede');

  const [feed, sidebar] = await Promise.all([
    getSocialFeed(user.profile.id, hashtag),
    getSocialFeedSidebar(user.profile.id),
  ]);

  return (
    <div className="space-y-4">
      <SocialPostComposer mentions={sidebar.mentions} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-extrabold text-title">
          {hashtag ? `#${hashtag}` : 'Atualizações dos seus amigos'}
        </h2>
        {hashtag && <Link href="/rede" className="text-xs font-bold text-brand hover:underline">Limpar filtro</Link>}
      </div>
      {feed.length > 0 ? (
        <div className="space-y-3">
          {feed.map((post) => <SocialPostCard key={`${post.repostedBy?.id ?? 'post'}-${post.id}-${post.createdAt}`} post={post} />)}
        </div>
      ) : (
        <EmptyState
          title={hashtag ? `Nenhuma publicação com #${hashtag}` : 'Seu feed ainda está tranquilo'}
          description="Publique uma atualização ou adicione amigos para acompanhar as novidades por aqui."
        />
      )}
    </div>
  );
}
