import Link from 'next/link';
import { redirect } from 'next/navigation';
import EmptyState from '@/components/EmptyState';
import AlbumForm from '@/features/photos/AlbumForm';
import { listAlbums } from '@/features/photos/queries';
import { getCurrentUser } from '@/lib/auth/session';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({ title: 'Minha galeria', path: '/rede/fotos', noindex: true });

export default async function RedeFotosPage() {
  const user = await getCurrentUser();
  if (!user?.profile) redirect('/login-rede-social?redirect=/rede/fotos');
  const slug = user.profile.slug;
  if (!slug) redirect('/perfil');
  const profile = user.profile;
  const albums = await listAlbums(profile.id);
  return (
    <div className="space-y-4">
      <section className="card-base p-4 sm:p-6">
        <h1 className="mb-4 text-2xl font-extrabold text-title">Galeria</h1>
        <AlbumForm slug={slug} />
      </section>
      {albums.length > 0 ? (
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {albums.map((album) => (
            <Link key={album.id} href={`/u/${slug}/fotos/${album.id}`} className="card-hover card-base overflow-hidden p-0">
              <div className="aspect-square bg-surface">
                {album.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={album.cover_url} alt="" className="h-full w-full object-cover" />
                ) : <span className="flex h-full items-center justify-center text-sm text-muted">Sem fotos</span>}
              </div>
              <div className="p-3"><p className="truncate text-sm font-bold text-title">{album.title}</p><p className="text-xs text-muted">{album.photo_count} fotos</p></div>
            </Link>
          ))}
        </section>
      ) : <EmptyState title="Nenhum álbum ainda" description="Crie seu primeiro álbum acima." />}
    </div>
  );
}
