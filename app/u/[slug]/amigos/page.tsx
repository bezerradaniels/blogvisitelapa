import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import EmptyState from '@/components/EmptyState';
import { getPublicProfile, listFriends } from '@/features/social/queries';
import { buildMetadata } from '@/lib/seo/metadata';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const profile = await getPublicProfile(slug);
  return buildMetadata({
    title: profile ? `Amigos de ${profile.full_name}` : 'Amigos',
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
      <div className="container-page max-w-2xl py-8">
        <Link href={`/u/${slug}`} className="text-sm font-bold text-brand hover:underline">
          ← {profile.full_name}
        </Link>
        <EmptyState title="Perfil restrito" description="Adicione como amigo para ver a lista." />
      </div>
    );
  }

  const friends = await listFriends(profile.id);

  return (
    <div className="container-page max-w-3xl py-8">
      <Link href={`/u/${slug}`} className="text-sm font-bold text-brand hover:underline">
        ← {profile.full_name}
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-extrabold text-title">Amigos ({friends.length})</h1>

      {friends.length > 0 ? (
        <ul className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
          {friends.map((p) => (
            <li key={p.id}>
              <Link href={`/u/${p.slug}`} className="flex flex-col items-center gap-1 text-center">
                <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-brand-soft text-xl font-extrabold text-brand-dark">
                  {p.avatar_url ? (
                    <Image src={p.avatar_url} alt="" width={64} height={64} className="object-cover" />
                  ) : (
                    (p.full_name ?? 'U').charAt(0).toUpperCase()
                  )}
                </span>
                <span className="line-clamp-2 text-xs font-semibold text-title">{p.full_name ?? 'Usuário'}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="Ainda sem amigos" />
      )}
    </div>
  );
}
