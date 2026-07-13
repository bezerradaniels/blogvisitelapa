import Link from 'next/link';
import { redirect } from 'next/navigation';
import EmptyState from '@/components/EmptyState';
import FriendButton from '@/features/social/FriendButton';
import { listFriendRequests, listFriends } from '@/features/social/queries';
import { getCurrentUser } from '@/lib/auth/session';
import { buildMetadata } from '@/lib/seo/metadata';
import { titleCase } from '@/lib/utils/format';

export const metadata = buildMetadata({ title: 'Meus amigos', path: '/rede/amigos', noindex: true });

export default async function RedeAmigosPage() {
  const user = await getCurrentUser();
  if (!user?.profile) redirect('/login-rede-social?redirect=/rede/amigos');
  const [friends, requests] = await Promise.all([
    listFriends(user.profile.id),
    listFriendRequests(user.profile.id),
  ]);
  return (
    <div className="space-y-4">
      {requests.length > 0 && (
        <section className="card-base p-4 sm:p-6">
          <h1 className="mb-4 text-xl font-extrabold text-title">Pedidos de amizade ({requests.length})</h1>
          <div className="space-y-3">
            {requests.map((request) => (
              <div key={request.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3 last:border-0 last:pb-0">
                <Link href={`/u/${request.slug}`} className="font-bold text-title hover:text-brand hover:underline">{titleCase(request.full_name) || 'Usuário'}</Link>
                <FriendButton targetProfileId={request.id} state="request_received" isLogged targetSlug={request.slug ?? ''} />
              </div>
            ))}
          </div>
        </section>
      )}
      <section className="card-base p-4 sm:p-6">
        <h1 className="mb-5 text-2xl font-extrabold text-title">Amigos ({friends.length})</h1>
      {friends.length > 0 ? (
        <div className="grid grid-cols-3 gap-5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {friends.map((friend) => (
            <Link key={friend.id} href={`/u/${friend.slug}`} className="min-w-0 text-center">
              {friend.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={friend.avatar_url} alt="" className="mx-auto h-16 w-16 rounded-full object-cover" />
              ) : (
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft text-xl font-bold text-brand-dark">{(friend.full_name ?? 'U').charAt(0)}</span>
              )}
              <span className="mt-2 block truncate text-xs font-semibold text-title">{titleCase(friend.full_name) || 'Usuário'}</span>
            </Link>
          ))}
        </div>
      ) : <EmptyState title="Ainda sem amigos" description="Visite perfis e envie pedidos de amizade." />}
      </section>
    </div>
  );
}
