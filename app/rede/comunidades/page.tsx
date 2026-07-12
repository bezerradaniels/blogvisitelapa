import Link from 'next/link';
import { redirect } from 'next/navigation';
import Button from '@/components/Button';
import CommunityCard from '@/components/CommunityCard';
import EmptyState from '@/components/EmptyState';
import { listCommunities, listUserCommunities } from '@/features/communities/queries';
import { getCurrentUser } from '@/lib/auth/session';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({ title: 'Minhas comunidades', path: '/rede/comunidades', noindex: true });

export default async function RedeComunidadesPage() {
  const user = await getCurrentUser();
  if (!user?.profile) redirect('/login-rede-social?redirect=/rede/comunidades');
  const [mine, suggestions] = await Promise.all([
    listUserCommunities(user.profile.id),
    listCommunities({}),
  ]);
  const mineIds = new Set(mine.map((community) => community.id));
  const explore = suggestions.filter((community) => !mineIds.has(community.id)).slice(0, 6);
  return (
    <div className="space-y-5">
      <section className="card-base p-4 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-extrabold text-title">Comunidades</h1>
          <Button href="/comunidades/nova" size="sm">Criar comunidade</Button>
        </div>
        {mine.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{mine.map((community) => <CommunityCard key={community.id} community={community} />)}</div>
        ) : <EmptyState title="Você ainda não participa de comunidades" action={<Button href="/comunidades">Explorar comunidades</Button>} />}
      </section>
      {explore.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between"><h2 className="font-bold text-title">Descobrir comunidades</h2><Link href="/comunidades" className="text-xs font-bold text-brand hover:underline">Ver todas</Link></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{explore.map((community) => <CommunityCard key={community.id} community={community} />)}</div>
        </section>
      )}
    </div>
  );
}
