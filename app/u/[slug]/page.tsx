import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import Badge from '@/components/Badge';
import { listUserCommunities } from '@/features/communities/queries';
import NewMessageButton from '@/features/messages/NewMessageButton';
import { listAlbums } from '@/features/photos/queries';
import BlockButton from '@/features/social/BlockButton';
import DeleteScrapButton from '@/features/social/DeleteScrapButton';
import FriendButton from '@/features/social/FriendButton';
import InteractionGate from '@/features/social/InteractionGate';
import ScrapForm from '@/features/social/ScrapForm';
import TestimonialForm from '@/features/social/TestimonialForm';
import SocialPostCard from '@/features/socialFeed/SocialPostCard';
import { getProfileSocialPosts } from '@/features/socialFeed/queries';
import {
  getFriendState,
  getPublicProfile,
  hasBlocked,
  listApprovedTestimonials,
  listFriends,
  listScraps,
} from '@/features/social/queries';
import { getCurrentUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { buildMetadata } from '@/lib/seo/metadata';
import { formatDate, timeAgo, titleCase } from '@/lib/utils/format';
import type { CommunityProfile } from '@/types/communities';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const profile = await getPublicProfile(slug);
  if (!profile) return buildMetadata({ title: 'Perfil', noindex: true });
  // Só indexa perfis públicos (details só vem quando visível ao visitante anônimo)
  // E que permitem indexação por buscadores (preferência do usuário).
  const isPublic = profile.canView && (profile.details?.visibility ?? 'oculto') === 'publico';
  let allowsIndexing = false;
  if (isPublic) {
    const supabase = await createClient();
    const { data } = await supabase.rpc('profile_allows_indexing', { p_target: profile.id });
    allowsIndexing = data !== false;
  }
  return buildMetadata({
    title: titleCase(profile.full_name) || 'Perfil',
    description: profile.details?.about ?? profile.bio ?? `Perfil de ${titleCase(profile.full_name) || 'usuário'} no Conecta Lapa.`,
    path: `/u/${slug}`,
    image: profile.avatar_url,
    noindex: !isPublic || !allowsIndexing,
  });
}

/* ---------- helpers apresentacionais (server, inline) ---------- */

function ProfileAvatar({ url, name, size = 40 }: { url: string | null; name: string | null; size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-soft font-headline font-extrabold text-brand-dark"
      style={{ width: size, height: size, fontSize: size / 2.5 }}
    >
      {url ? (
        <Image src={url} alt="" width={size} height={size} className="h-full w-full object-cover" />
      ) : (
        (name ?? 'U').charAt(0).toUpperCase()
      )}
    </span>
  );
}

// Título de seção com a "pílula-folha" do tema. Sem margem própria — quem usa
// define o espaçamento (evita desalinhar dentro de linhas flex com "Ver todos").
function SectionHeading({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={`flex items-center gap-2 text-base font-extrabold text-title${className ? ` ${className}` : ''}`}>
      <span className="leaf-pill" aria-hidden />
      {children}
    </h2>
  );
}

function FriendTile({ p }: { p: CommunityProfile }) {
  return (
    <Link
      href={`/u/${p.slug}`}
      className="card-hover flex flex-col items-center gap-1.5 text-center"
      title={p.full_name ?? ''}
    >
      <ProfileAvatar url={p.avatar_url} name={p.full_name} size={56} />
      <span className="line-clamp-1 w-full text-xs font-semibold text-title">{titleCase(p.full_name) || 'Usuário'}</span>
    </Link>
  );
}

function ProfileRow({ label, children }: { label: string; children: ReactNode }) {
  if (!children) return null;
  return (
    <div className="grid gap-1 px-3 py-2.5 even:bg-surface sm:grid-cols-[140px_1fr] sm:gap-4">
      <dt className="text-xs font-semibold text-muted sm:text-right">{label}</dt>
      <dd className="whitespace-pre-wrap text-sm text-body">{children}</dd>
    </div>
  );
}

function NavItem({ href, children, count }: { href: string; children: ReactNode; count?: number }) {
  return (
    <li>
      <a href={href} className="flex min-h-[40px] items-center rounded-[10px] px-3 text-sm font-bold text-body transition-colors hover:bg-surface">
        {children}
        {typeof count === 'number' && <span className="ml-auto text-xs font-semibold text-muted">{count}</span>}
      </a>
    </li>
  );
}

function VisibilityLabel({ value }: { value: string | null | undefined }) {
  const labels: Record<string, string> = { publico: 'Público', amigos: 'Somente amigos', oculto: 'Oculto' };
  return <>{labels[value ?? ''] ?? 'Não informado'}</>;
}

function ProfileSummary({ profile, details }: { profile: { full_name: string | null; avatar_url: string | null; bio: string | null }; details: { nickname: string | null; city: string | null; relationship: string | null } | null }) {
  return (
    <div className="flex flex-col items-center text-center">
      <span className="inline-block rounded-full border-4 border-brand-soft p-1">
        <ProfileAvatar url={profile.avatar_url} name={profile.full_name} size={104} />
      </span>
      <h1 className="mt-3 text-lg font-extrabold leading-tight text-title">{titleCase(profile.full_name)}</h1>
      {details?.nickname && <p className="mt-0.5 text-sm font-semibold text-brand">{details.nickname}</p>}
      {profile.bio && <p className="mt-2 line-clamp-3 text-sm text-muted">{profile.bio}</p>}
      <div className="mt-2 space-y-0.5 text-xs text-muted">
        {details?.relationship && <p>{details.relationship}</p>}
        {details?.city && <p>{details.city}</p>}
      </div>
    </div>
  );
}

/* Campo vazio não ocupa espaço na ficha. */
function OptionalProfileRow({ label, value }: { label: string; value: ReactNode }) {
  if (!value) return null;
  return <ProfileRow label={label}>{value}</ProfileRow>;
}

export default async function PerfilPublicoPage({ params }: Props) {
  const { slug } = await params;
  const [profile, viewer] = await Promise.all([getPublicProfile(slug), getCurrentUser()]);
  if (!profile) notFound();

  const viewerId = viewer?.profile?.id ?? null;
  const [friendState, blocked] = await Promise.all([
    getFriendState(profile.id, viewerId),
    hasBlocked(profile.id, viewerId),
  ]);
  const isOwner = friendState === 'self';
  const isFriend = friendState === 'friends';
  const d = profile.details;
  const isAuthor = profile.role === 'publisher' || profile.role === 'admin';

  // Perfil restrito (oculto ou só-amigos para não-amigo).
  if (!profile.canView) {
    return (
      <div className="container-page max-w-3xl py-8">
        <div className="card-base mx-auto max-w-sm p-5">
          <ProfileSummary profile={profile} details={d} />
        </div>
        <div className="card-base mx-auto mt-6 flex max-w-sm flex-col items-center px-6 py-10 text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-xl text-brand-dark" aria-hidden>
            🔒
          </span>
          <h2 className="text-base font-extrabold text-title">Este perfil é restrito</h2>
          <p className="mt-1 max-w-sm text-sm text-muted">
            {friendState === 'none' || friendState === 'request_sent'
              ? 'Adicione como amigo para ver o perfil completo.'
              : 'O conteúdo deste perfil não está disponível.'}
          </p>
          {!isOwner && (
            <div className="mt-4">
              <FriendButton
                targetProfileId={profile.id}
                state={friendState}
                isLogged={Boolean(viewer)}
                targetSlug={slug}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  const [recentPosts, scraps, testimonials, friends, albums, communities] = await Promise.all([
    getProfileSocialPosts(profile.id, viewerId, 3),
    listScraps(profile.id),
    listApprovedTestimonials(profile.id),
    listFriends(profile.id),
    listAlbums(profile.id),
    listUserCommunities(profile.id),
  ]);

  return (
    <div className="container-page py-8">
      <nav aria-label="Trilha" className="mb-4 flex flex-wrap items-center gap-1.5 text-xs font-semibold text-muted">
        <Link href="/" className="hover:text-brand">Início</Link>
        <span aria-hidden>›</span>
        <span>Perfis</span>
        <span aria-hidden>›</span>
        <span className="text-title">{titleCase(profile.full_name)}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr_300px]">
        <aside className="space-y-4">
          <div className="card-base p-4">
            <ProfileSummary profile={profile} details={d} />
            {isAuthor && <div className="mt-3 text-center"><Badge tone="brand">{profile.role === 'admin' ? 'Editor' : 'Colaborador'}</Badge></div>}

            <hr className="my-4 border-line" />

            <div className="flex flex-col items-center gap-3">
              {isOwner ? (
                <Link href="/perfil" className="inline-flex min-h-[40px] items-center justify-center rounded-full border border-line bg-card px-4 text-sm font-bold text-brand hover:bg-surface">Editar perfil</Link>
              ) : (
                <>
                  <FriendButton targetProfileId={profile.id} state={friendState} isLogged={Boolean(viewer)} targetSlug={slug} />
                  {isFriend && <NewMessageButton targetProfileId={profile.id} />}
                  {viewer && <BlockButton targetProfileId={profile.id} blocked={blocked} />}
                </>
              )}
            </div>

            <hr className="my-4 border-line" />

            <nav aria-label="Seções do perfil">
              <ul className="space-y-1">
                <NavItem href={`/u/${slug}`}>Perfil</NavItem>
                <NavItem href={`/u/${slug}/feed`}>Feed</NavItem>
                <NavItem href={`/u/${slug}/recados`} count={scraps.length}>Recados</NavItem>
                <NavItem href={`/u/${slug}/fotos`} count={albums.length}>Fotos</NavItem>
                <NavItem href={`/u/${slug}/depoimentos`} count={testimonials.length}>Depoimentos</NavItem>
                <NavItem href={`/u/${slug}/amigos`} count={profile.friendCount}>Amigos</NavItem>
                <NavItem href={`/u/${slug}/comunidades`} count={communities.length}>Comunidades</NavItem>
              </ul>
            </nav>
          </div>
        </aside>

        {/* Coluna principal */}
        <div className="min-w-0 space-y-6">
          <section id="sobre" className="card-base scroll-mt-24 overflow-hidden p-4 sm:p-5">
            <SectionHeading className="mb-4">Informações do perfil</SectionHeading>
            <dl className="overflow-hidden rounded-[10px] border border-line">
              <OptionalProfileRow label="Apelido" value={d?.nickname} />
              <OptionalProfileRow label="Relacionamento" value={d?.relationship} />
              <OptionalProfileRow label="Aniversário" value={d?.birth_date ? formatDate(d.birth_date, "d 'de' MMMM") : null} />
              <OptionalProfileRow label="Cidade" value={d?.city} />
              <OptionalProfileRow label="Interesses" value={d?.interests} />
              <OptionalProfileRow label="Quem sou eu" value={d?.about ?? profile.bio} />
              <ProfileRow label="Visibilidade"><VisibilityLabel value={d?.visibility} /></ProfileRow>
            </dl>
          </section>

          {/* Atualizações curtas do perfil */}
          <section className="scroll-mt-24 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <SectionHeading>Feed</SectionHeading>
              <Link href={`/u/${slug}/feed`} className="text-xs font-bold text-brand hover:underline">
                Ver mais atualizações
              </Link>
            </div>
            {recentPosts.length > 0 ? (
              recentPosts.map((post) => (
                <SocialPostCard
                  key={post.id}
                  post={post}
                  isLogged={Boolean(viewer)}
                  loginRedirect={`/u/${slug}/feed`}
                />
              ))
            ) : (
              <div className="card-base p-4 text-sm text-muted">Nenhuma atualização publicada ainda.</div>
            )}
          </section>

          {/* Recados / mural */}
          <section id="recados" className="card-base scroll-mt-24 p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <SectionHeading>Recados</SectionHeading>
              <Link href={`/u/${slug}/recados`} className="text-xs font-bold text-brand hover:underline">
                Ver todos
              </Link>
            </div>
            {isFriend && (
              <div className="mb-4">
                <ScrapForm profileId={profile.id} />
              </div>
            )}
            {!isFriend && !isOwner && (
              <div className="mb-4">
                <InteractionGate
                  kind="recado"
                  isLogged={Boolean(viewer)}
                  friendState={friendState}
                  targetProfileId={profile.id}
                  targetSlug={slug}
                  targetName={d?.nickname ?? profile.full_name ?? 'este usuário'}
                />
              </div>
            )}
            {scraps.length > 0 ? (
              <ul className="space-y-3">
                {scraps.map((s) => (
                  <li key={s.id} className="flex gap-3 rounded-[10px] bg-surface p-3">
                    <ProfileAvatar url={s.author?.avatar_url ?? null} name={s.author?.full_name ?? null} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                        <Link href={`/u/${s.author?.slug}`} className="font-bold text-title hover:underline">
                          {titleCase(s.author?.full_name) || 'Usuário'}
                        </Link>
                        <span>{timeAgo(s.created_at)}</span>
                        {(isOwner || s.author?.id === viewerId) && <DeleteScrapButton scrapId={s.id} />}
                      </div>
                      <p className="mt-0.5 whitespace-pre-wrap text-sm text-body">{s.content}</p>
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
          <section id="depoimentos" className="card-base scroll-mt-24 p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <SectionHeading>Depoimentos</SectionHeading>
              <Link href={`/u/${slug}/depoimentos`} className="text-xs font-bold text-brand hover:underline">
                Ver todos
              </Link>
            </div>
            {isFriend && (
              <div className="mb-4">
                <TestimonialForm profileId={profile.id} />
              </div>
            )}
            {!isFriend && !isOwner && (
              <div className="mb-4">
                <InteractionGate
                  kind="depoimento"
                  isLogged={Boolean(viewer)}
                  friendState={friendState}
                  targetProfileId={profile.id}
                  targetSlug={slug}
                  targetName={d?.nickname ?? profile.full_name ?? 'este usuário'}
                />
              </div>
            )}
            {testimonials.length > 0 ? (
              <ul className="space-y-3">
                {testimonials.map((t) => (
                  <li key={t.id} className="flex gap-3 rounded-[10px] bg-surface p-3">
                    <ProfileAvatar url={t.author?.avatar_url ?? null} name={t.author?.full_name ?? null} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                        <Link href={`/u/${t.author?.slug}`} className="font-bold text-title hover:underline">
                          {titleCase(t.author?.full_name) || 'Usuário'}
                        </Link>
                        <span>{timeAgo(t.created_at)}</span>
                      </div>
                      <p className="mt-0.5 whitespace-pre-wrap text-sm text-body">{t.content}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">Nenhum depoimento aprovado ainda.</p>
            )}
          </section>
        </div>

        {/* Coluna social */}
        <aside className="space-y-6">
          <div id="amigos" className="card-base scroll-mt-24 p-4">
            <div className="mb-3 flex items-center justify-between">
              <SectionHeading>Amigos</SectionHeading>
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

          <div id="fotos" className="card-base scroll-mt-24 p-4">
            <div className="mb-3 flex items-center justify-between">
              <SectionHeading>Fotos</SectionHeading>
              <Link href={`/u/${slug}/fotos`} className="text-xs font-bold text-brand hover:underline">
                Ver álbuns
              </Link>
            </div>
            {albums.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {albums.slice(0, 6).map((a) => (
                  <Link
                    key={a.id}
                    href={`/u/${slug}/fotos/${a.id}`}
                    className="card-hover relative aspect-square overflow-hidden rounded-[10px] bg-surface"
                    title={a.title}
                  >
                    {a.cover_url && <Image src={a.cover_url} alt={a.title} fill sizes="120px" className="object-cover" />}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">Nenhum álbum ainda.</p>
            )}
          </div>

          <div id="comunidades" className="card-base scroll-mt-24 p-4">
            <div className="mb-3 flex items-center justify-between">
              <SectionHeading>Comunidades</SectionHeading>
              <Link href={`/u/${slug}/comunidades`} className="text-xs font-bold text-brand hover:underline">
                Ver todas
              </Link>
            </div>
            {communities.length > 0 ? (
              <div className="grid grid-cols-3 items-start gap-3">
                {communities.slice(0, 9).map((c) => (
                  <Link
                    key={c.id}
                    href={`/comunidades/${c.slug}`}
                    className="card-hover flex flex-col items-center gap-1.5 text-center"
                    title={c.name}
                  >
                    <span className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-[12px] bg-brand-soft text-2xl font-extrabold text-brand-dark">
                      {c.avatar_url ? (
                        <Image src={c.avatar_url} alt="" fill sizes="90px" className="object-cover" />
                      ) : (
                        c.name.charAt(0).toUpperCase()
                      )}
                    </span>
                    <span className="w-full break-words text-xs font-semibold leading-tight text-title">{c.name}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">Nenhuma comunidade ainda.</p>
            )}
          </div>

          {isAuthor && (
            <div className="card-base p-4">
              <p className="text-sm font-semibold text-title">Publicações</p>
              <Link href={`/autor/${slug}`} className="mt-1 inline-block text-sm font-bold text-brand hover:underline">
                Ver publicações →
              </Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
