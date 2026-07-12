import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import EmptyState from '@/components/EmptyState';
import PublicProfileShell from '@/components/PublicProfileShell';
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
      <PublicProfileShell profile={profile} slug={slug}>
        <EmptyState title="Perfil restrito" description="Adicione como amigo para ver as fotos." />
      </PublicProfileShell>
    );
  }

  const albums = await listAlbums(profile.id);

  return (
    <PublicProfileShell profile={profile} slug={slug}>
      <div className="space-y-4">
        <section className="card-base p-4 sm:p-6">
          <h1 className="mb-6 text-2xl font-extrabold text-title">Álbuns de fotos</h1>

          {isOwner && <AlbumForm slug={slug} />}
        </section>

        {albums.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
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
    </PublicProfileShell>
  );
}
