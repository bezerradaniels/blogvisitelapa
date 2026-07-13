import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import EmptyState from '@/components/EmptyState';
import PublicProfileShell from '@/components/PublicProfileShell';
import { getPublicProfile, listFriends } from '@/features/social/queries';
import { buildMetadata } from '@/lib/seo/metadata';
import { titleCase } from '@/lib/utils/format';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const profile = await getPublicProfile(slug);
  return buildMetadata({
    title: profile ? `Amigos de ${titleCase(profile.full_name)}` : 'Amigos',
    path: `/u/${slug}/amigos`,
    noindex: true,
  });
}

export default async function AmigosPage({ params }: Props) {
  const { slug } = await params;
  const profile = await getPublicProfile(slug);
  if (!profile) notFound();

  if (!profile.canView) {
    return (
      <PublicProfileShell profile={profile} slug={slug}>
        <EmptyState title="Perfil restrito" description="Adicione como amigo para ver a lista." />
      </PublicProfileShell>
    );
  }

  const friends = await listFriends(profile.id);

  return (
    <PublicProfileShell profile={profile} slug={slug}>
      <section className="card-base p-4 sm:p-6">
        <h1 className="mb-6 text-2xl font-extrabold text-title">Amigos ({friends.length})</h1>

        {friends.length > 0 ? (
          <ul className="grid grid-cols-3 gap-5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {friends.map((p) => (
              <li key={p.id}>
                <Link href={`/u/${p.slug}`} className="flex flex-col items-center gap-2 text-center">
                  <span className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-brand-soft text-xl font-extrabold text-brand-dark">
                    {p.avatar_url ? (
                      <Image src={p.avatar_url} alt="" width={80} height={80} className="h-full w-full object-cover" />
                    ) : (
                      (p.full_name ?? 'U').charAt(0).toUpperCase()
                    )}
                  </span>
                  <span className="line-clamp-2 text-xs font-semibold text-title">{titleCase(p.full_name) || 'Usuário'}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Ainda sem amigos" />
        )}
      </section>
    </PublicProfileShell>
  );
}
