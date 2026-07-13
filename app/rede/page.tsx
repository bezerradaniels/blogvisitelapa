import Link from 'next/link';
import { redirect } from 'next/navigation';
import EmptyState from '@/components/EmptyState';
import { listAlbums } from '@/features/photos/queries';
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
  const profile = user.profile;

  const [feed, sidebar, albums] = await Promise.all([
    getSocialFeed(profile.id, hashtag),
    getSocialFeedSidebar(profile.id),
    listAlbums(profile.id),
  ]);

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-4">
        <SocialPostComposer />
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

      <aside className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1" aria-label="Atalhos da rede social">
        <section className="card-base p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-title"><span className="leaf-pill h-6 w-6" aria-hidden />Amigos</h2>
            <Link href="/rede/amigos" className="text-sm font-bold text-brand hover:underline">Ver todos</Link>
          </div>
          {sidebar.friends.length > 0 ? (
            <ul className="mt-5 grid grid-cols-2 gap-x-3 gap-y-4">
              {sidebar.friends.slice(0, 6).map((friend) => (
                <li key={friend.id}>
                  <Link href={friend.slug ? `/u/${friend.slug}` : '/rede/amigos'} className="flex w-fit max-w-full flex-col items-center gap-2 text-center hover:text-brand">
                    {friend.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={friend.avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft text-2xl font-extrabold text-brand-dark">
                        {friend.fullName.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span className="line-clamp-2 max-w-full self-start text-left text-sm font-bold text-title">{friend.fullName}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">Você ainda não adicionou amigos.</p>
          )}
        </section>

        <section className="card-base p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-title"><span className="leaf-pill h-6 w-6" aria-hidden />Fotos</h2>
            <Link href="/rede/fotos" className="text-sm font-bold text-brand hover:underline">Ver álbuns</Link>
          </div>
          {albums.length > 0 ? (
            <ul className="mt-5 grid grid-cols-2 gap-3">
              {albums.slice(0, 4).map((album) => (
                <li key={album.id}>
                  <Link href={profile.slug ? `/u/${profile.slug}/fotos/${album.id}` : '/rede/fotos'} className="block hover:text-brand">
                    {album.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={album.cover_url} alt="" className="aspect-square w-full rounded-[14px] object-cover" />
                    ) : (
                      <span className="flex aspect-square items-center justify-center rounded-[14px] bg-brand-soft text-xl font-extrabold text-brand-dark">{album.title.charAt(0).toUpperCase()}</span>
                    )}
                    <span className="mt-2 block line-clamp-2 text-sm font-bold text-title">{album.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 text-sm text-muted">Nenhum álbum ainda.</p>
          )}
        </section>

        <section className="card-base p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-title"><span className="leaf-pill h-6 w-6" aria-hidden />Comunidades</h2>
            <Link href="/rede/comunidades" className="text-sm font-bold text-brand hover:underline">Ver todas</Link>
          </div>
          {sidebar.communities.length > 0 ? (
            <ul className="mt-5 grid grid-cols-2 gap-x-3 gap-y-4">
              {sidebar.communities.slice(0, 6).map((community) => (
                <li key={community.id}>
                  <Link href={`/comunidades/${community.slug}`} className="flex flex-col items-center gap-2 text-center hover:text-brand">
                    {community.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={community.avatarUrl} alt="" className="h-20 w-20 rounded-[14px] object-cover" />
                    ) : (
                      <span className="flex h-20 w-20 items-center justify-center rounded-[14px] bg-brand-soft text-2xl font-extrabold text-brand-dark">
                        {community.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span className="line-clamp-2 text-sm font-bold text-title">{community.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">Você ainda não participa de comunidades.</p>
          )}
        </section>
      </aside>
    </div>
  );
}
