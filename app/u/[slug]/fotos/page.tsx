import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import EmptyState from '@/components/EmptyState';
import AlbumForm from '@/features/photos/AlbumForm';
import { listAlbums } from '@/features/photos/queries';
import { getPublicProfile } from '@/features/social/queries';
import { getCurrentUser } from '@/lib/auth/session';
import { buildMetadata } from '@/lib/seo/metadata';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const profile = await getPublicProfile(slug);
  return buildMetadata({
    title: profile ? `Fotos de ${profile.full_name}` : 'Fotos',
    path: `/u/${slug}/fotos`,
    noindex: true,
  });
}

export default async function FotosPage({ params }: Props) {
  const { slug } = await params;
  const [profile, viewer] = await Promise.all([getPublicProfile(slug), getCurrentUser()]);
  if (!profile) notFound();

  const isOwner = viewer?.profile?.id === profile.id;

  if (!profile.canView) {
    return (
      <div className="container-page max-w-3xl py-8">
        <Link href={`/u/${slug}`} className="text-sm font-bold text-brand hover:underline">
          ← {profile.full_name}
        </Link>
        <EmptyState title="Perfil restrito" description="Adicione como amigo para ver as fotos." />
      </div>
    );
  }

  const albums = await listAlbums(profile.id);

  return (
    <div className="container-page max-w-3xl py-8">
      <Link href={`/u/${slug}`} className="text-sm font-bold text-brand hover:underline">
        ← {profile.full_name}
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-extrabold text-title">Álbuns de fotos</h1>

      {isOwner && (
        <div className="card-base mb-6 p-4">
          <AlbumForm slug={slug} />
        </div>
      )}

      {albums.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {albums.map((a) => (
            <Link key={a.id} href={`/u/${slug}/fotos/${a.id}`} className="card-hover card-base overflow-hidden p-0">
              <div className="relative aspect-square bg-surface">
                {a.cover_url ? (
                  <Image src={a.cover_url} alt="" fill sizes="300px" className="object-cover" />
                ) : (
                  <span className="flex h-full items-center justify-center text-sm text-muted">Sem fotos</span>
                )}
              </div>
              <div className="p-2">
                <p className="truncate text-sm font-bold text-title">{a.title}</p>
                <p className="text-xs text-muted">{a.photo_count} {a.photo_count === 1 ? 'foto' : 'fotos'}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title="Nenhum álbum ainda" description={isOwner ? 'Crie um álbum acima.' : undefined} />
      )}
    </div>
  );
}
