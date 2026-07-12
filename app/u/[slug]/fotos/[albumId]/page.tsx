import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import EmptyState from '@/components/EmptyState';
import PublicProfileShell from '@/components/PublicProfileShell';
import PhotoUploader from '@/features/photos/PhotoUploader';
import { DeleteAlbumButton, DeletePhotoButton } from '@/features/photos/PhotoActions';
import { getAlbum, listPhotos } from '@/features/photos/queries';
import { getPublicProfile } from '@/features/social/queries';
import { getCurrentUser } from '@/lib/auth/session';
import { buildMetadata } from '@/lib/seo/metadata';

interface Props {
  params: Promise<{ slug: string; albumId: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug, albumId } = await params;
  const album = await getAlbum(albumId);
  return buildMetadata({
    title: album?.title ?? 'Álbum',
    path: `/u/${slug}/fotos/${albumId}`,
    noindex: true,
  });
}

export default async function AlbumPage({ params }: Props) {
  const { slug, albumId } = await params;
  const [profile, viewer, album] = await Promise.all([
    getPublicProfile(slug),
    getCurrentUser(),
    getAlbum(albumId),
  ]);
  if (!profile) notFound();
  if (!profile.canView || !album || album.profile_id !== profile.id) notFound();

  const isOwner = viewer?.profile?.id === profile.id;
  const photos = await listPhotos(albumId);

  return (
    <PublicProfileShell profile={profile} slug={slug}>
      <section className="card-base p-4 sm:p-6">
        <Link href={`/u/${slug}/fotos`} className="text-sm font-bold text-brand hover:underline">
          ← Álbuns de {profile.full_name}
        </Link>

        <div className="mb-6 mt-2 flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-extrabold text-title">{album.title}</h1>
          {isOwner && (
            <div className="flex items-center gap-3">
              <PhotoUploader albumId={albumId} userId={viewer!.userId} />
              <DeleteAlbumButton albumId={albumId} slug={slug} />
            </div>
          )}
        </div>

        {photos.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {photos.map((p) => (
              <div key={p.id} className="group relative aspect-square overflow-hidden rounded-[14px] bg-surface">
                <Image src={p.url} alt={p.caption ?? ''} fill sizes="300px" className="object-cover" />
                {isOwner && (
                  <div className="absolute right-1 top-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <DeletePhotoButton photoId={p.id} />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Álbum vazio" description={isOwner ? 'Adicione fotos acima.' : undefined} />
        )}
      </section>
    </PublicProfileShell>
  );
}
