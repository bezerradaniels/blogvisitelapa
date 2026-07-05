import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Badge from '@/components/Badge';
import DeleteScrapButton from '@/features/social/DeleteScrapButton';
import FriendButton from '@/features/social/FriendButton';
import ScrapForm from '@/features/social/ScrapForm';
import TestimonialForm from '@/features/social/TestimonialForm';
import {
  getFriendState,
  getPublicProfile,
  listApprovedTestimonials,
  listFriends,
  listScraps,
} from '@/features/social/queries';
import { getCurrentUser } from '@/lib/auth/session';
import { buildMetadata } from '@/lib/seo/metadata';
import { formatDate, timeAgo } from '@/lib/utils/format';
import type { CommunityProfile } from '@/types/communities';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const profile = await getPublicProfile(slug);
  if (!profile) return buildMetadata({ title: 'Perfil', noindex: true });
  // Só indexa perfis públicos (details só vem quando visível ao visitante anônimo).
  const isPublic = profile.canView && (profile.details?.visibility ?? 'oculto') === 'publico';
  return buildMetadata({
    title: profile.full_name ?? 'Perfil',
    description: profile.details?.about ?? profile.bio ?? `Perfil de ${profile.full_name} no Visite Lapa.`,
    path: `/u/${slug}`,
    image: profile.avatar_url,
    noindex: !isPublic,
  });
}

function ProfileAvatar({ url, name, size = 40 }: { url: string | null; name: string | null; size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-soft font-extrabold text-brand-dark"
      style={{ width: size, height: size, fontSize: size / 2.5 }}
    >
      {url ? (
        <Image src={url} alt="" width={size} height={size} className="object-cover" />
      ) : (
        (name ?? 'U').charAt(0).toUpperCase()
      )}
    </span>
  );
}

function FriendTile({ p }: { p: CommunityProfile }) {
  return (
    <Link href={`/u/${p.slug}`} className="flex flex-col items-center gap-1 text-center" title={p.full_name ?? ''}>
      <ProfileAvatar url={p.avatar_url} name={p.full_name} size={48} />
      <span className="line-clamp-1 text-xs font-semibold text-title">{p.full_name ?? 'Usuário'}</span>
    </Link>
  );
}

export default async function PerfilPublicoPage({ params }: Props) {
  const { slug } = await params;
  const [profile, viewer] = await Promise.all([getPublicProfile(slug), getCurrentUser()]);
  if (!profile) notFound();

  const viewerId = viewer?.profile?.id ?? null;
  const friendState = await getFriendState(profile.id, viewerId);
  const isOwner = friendState === 'self';
  const isFriend = friendState === 'friends';
  const d = profile.details;

  const header = (
    <header className="card-base mb-6 overflow-hidden p-0">
      <div className="h-28 bg-brand-soft sm:h-36">
        {d?.cover_url && (
          <div className="relative h-full w-full">
            <Image src={d.cover_url} alt="" fill sizes="900px" className="object-cover" />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
        <div className="-mt-12 sm:-mt-14">
          <span className="block rounded-full border-4 border-card">
            <ProfileAvatar url={profile.avatar_url} name={profile.full_name} size={88} />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-extrabold text-title">{profile.full_name}</h1>
          <p className="text-sm text-muted">
            {d?.nickname ? `“${d.nickname}”` : null}
            {d?.city ? `${d?.nickname ? ' · ' : ''}${d.city}` : null}
          </p>
          <p className="mt-1 text-xs text-muted">
            {profile.friendCount} {profile.friendCount === 1 ? 'amigo' : 'amigos'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isOwner ? (
            <Link href="/perfil" className="text-sm font-bold text-brand hover:underline">
              Editar perfil
            </Link>
          ) : (
            <FriendButton
              targetProfileId={profile.id}
              state={friendState}
              isLogged={Boolean(viewer)}
              targetSlug={slug}
            />
          )}
        </div>
      </div>
    </header>
  );

  // Perfil restrito (oculto ou só-amigos para não-amigo).
  if (!profile.canView) {
    return (
      <div className="container-page max-w-3xl py-8">
        {header}
        <div className="card-base p-6 text-center">
          <h2 className="text-base font-bold text-title">Este perfil é restrito</h2>
          <p className="mt-1 text-sm text-muted">
            {friendState === 'none' || friendState === 'request_sent'
              ? 'Adicione como amigo para ver o perfil completo.'
              : 'O conteúdo deste perfil não está disponível.'}
          </p>
        </div>
      </div>
    );
  }

  const [scraps, testimonials, friends] = await Promise.all([
    listScraps(profile.id),
    listApprovedTestimonials(profile.id),
    listFriends(profile.id),
  ]);

  return (
    <div className="container-page py-8">
      {header}

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-6">
          {/* Sobre */}
          {(d?.about || d?.interests || d?.relationship || d?.birth_date) && (
            <section className="card-base p-4">
              <h2 className="mb-2 text-sm font-extrabold text-title">Sobre</h2>
              {d?.about && <p className="mb-3 whitespace-pre-wrap text-sm text-body">{d.about}</p>}
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                {d?.relationship && (
                  <div>
                    <dt className="text-xs font-semibold text-muted">Relacionamento</dt>
                    <dd className="text-body">{d.relationship}</dd>
                  </div>
                )}
                {d?.birth_date && (
                  <div>
                    <dt className="text-xs font-semibold text-muted">Aniversário</dt>
                    <dd className="text-body">{formatDate(d.birth_date, "d 'de' MMMM")}</dd>
                  </div>
                )}
                {d?.interests && (
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-semibold text-muted">Interesses</dt>
                    <dd className="text-body">{d.interests}</dd>
                  </div>
                )}
              </dl>
            </section>
          )}

          {/* Recados / mural */}
          <section className="card-base p-4">
            <h2 className="mb-3 text-sm font-extrabold text-title">Recados</h2>
            {isFriend && (
              <div className="mb-3">
                <ScrapForm profileId={profile.id} />
              </div>
            )}
            {scraps.length > 0 ? (
              <ul className="space-y-3">
                {scraps.map((s) => (
                  <li key={s.id} className="flex gap-3">
                    <ProfileAvatar url={s.author?.avatar_url ?? null} name={s.author?.full_name ?? null} size={36} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-xs text-muted">
                        <Link href={`/u/${s.author?.slug}`} className="font-bold text-title hover:underline">
                          {s.author?.full_name ?? 'Usuário'}
                        </Link>
                        <span>{timeAgo(s.created_at)}</span>
                        {(isOwner || s.author?.id === viewerId) && <DeleteScrapButton scrapId={s.id} />}
                      </div>
                      <p className="whitespace-pre-wrap text-sm text-body">{s.content}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">
                {isFriend ? 'Seja o primeiro a deixar um recado.' : 'Nenhum recado ainda.'}
              </p>
            )}
          </section>

          {/* Depoimentos */}
          <section className="card-base p-4">
            <h2 className="mb-3 text-sm font-extrabold text-title">Depoimentos</h2>
            {isFriend && (
              <div className="mb-3">
                <TestimonialForm profileId={profile.id} />
              </div>
            )}
            {testimonials.length > 0 ? (
              <ul className="space-y-3">
                {testimonials.map((t) => (
                  <li key={t.id} className="flex gap-3">
                    <ProfileAvatar url={t.author?.avatar_url ?? null} name={t.author?.full_name ?? null} size={36} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-xs text-muted">
                        <Link href={`/u/${t.author?.slug}`} className="font-bold text-title hover:underline">
                          {t.author?.full_name ?? 'Usuário'}
                        </Link>
                        <span>{timeAgo(t.created_at)}</span>
                      </div>
                      <p className="whitespace-pre-wrap text-sm text-body">{t.content}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">Nenhum depoimento aprovado ainda.</p>
            )}
          </section>
        </div>

        {/* Amigos */}
        <aside>
          <div className="card-base p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-title">Amigos</h2>
              <Link href={`/u/${slug}/amigos`} className="text-xs font-bold text-brand hover:underline">
                Ver todos
              </Link>
            </div>
            {friends.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {friends.slice(0, 9).map((p) => (
                  <FriendTile key={p.id} p={p} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">Ainda sem amigos.</p>
            )}
          </div>
          {profile.role === 'admin' || profile.role === 'publisher' ? (
            <div className="card-base mt-4 p-4">
              <Badge tone="brand">{profile.role === 'admin' ? 'Editor' : 'Colaborador'}</Badge>
              <Link href={`/autor/${slug}`} className="mt-2 block text-sm font-bold text-brand hover:underline">
                Ver publicações →
              </Link>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
