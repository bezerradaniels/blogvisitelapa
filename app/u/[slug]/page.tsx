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
import ScrapForm from '@/features/social/ScrapForm';
import TestimonialForm from '@/features/social/TestimonialForm';
import {
  getFriendState,
  getPublicProfile,
  hasBlocked,
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
    description: profile.details?.about ?? profile.bio ?? `Perfil de ${profile.full_name} no Conecta Lapa.`,
    path: `/u/${slug}`,
    image: profile.avatar_url,
    noindex: !isPublic,
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

// Contador social (dado real; nostálgico, não é reputação).
function StatChip({ label, value, href }: { label: string; value: number; href?: string }) {
  const inner = (
    <span className="inline-flex items-baseline gap-1.5 rounded-full bg-brand-soft px-3 py-1.5 transition-[filter] hover:brightness-95">
      <span className="font-headline text-base font-extrabold leading-none text-brand-dark">{value}</span>
      <span className="text-xs font-semibold text-muted">{label}</span>
    </span>
  );
  return href ? (
    <Link href={href} className="focus-visible:outline-none">
      {inner}
    </Link>
  ) : (
    inner
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
      <span className="line-clamp-1 w-full text-xs font-semibold text-title">{p.full_name ?? 'Usuário'}</span>
    </Link>
  );
}

// Campo rótulo/valor do card "Sobre".
function Field({ label, value, full }: { label: string; value: ReactNode; full?: boolean }) {
  if (!value) return null;
  return (
    <div className={full ? 'sm:col-span-2' : undefined}>
      <dt className="text-xs font-semibold text-muted">{label}</dt>
      <dd className="whitespace-pre-wrap text-sm text-body">{value}</dd>
    </div>
  );
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

  // Cabeçalho de identidade (reusado no estado restrito e no completo).
  const renderHeader = (stats?: ReactNode) => (
    <header className="card-base overflow-hidden p-0">
      <div className="cover-fallback relative h-32 sm:h-44">
        {d?.cover_url && <Image src={d.cover_url} alt="" fill sizes="(max-width: 1024px) 100vw, 900px" className="object-cover" priority />}
      </div>
      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <div className="relative z-10 -mt-20 shrink-0 sm:-mt-24">
              <span className="inline-block rounded-full border-4 border-card shadow-card">
                <ProfileAvatar url={profile.avatar_url} name={profile.full_name} size={112} />
              </span>
            </div>
            <div className="min-w-0 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-extrabold text-title">{profile.full_name}</h1>
                {isAuthor && <Badge tone="brand">{profile.role === 'admin' ? 'Editor' : 'Colaborador'}</Badge>}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-3 sm:pb-1">
            {isOwner ? (
              <Link
                href="/perfil"
                className="inline-flex min-h-[40px] items-center justify-center rounded-full border border-line bg-card px-4 text-sm font-bold text-brand hover:bg-surface"
              >
                Editar perfil
              </Link>
            ) : (
              <>
                <FriendButton
                  targetProfileId={profile.id}
                  state={friendState}
                  isLogged={Boolean(viewer)}
                  targetSlug={slug}
                />
                {isFriend && <NewMessageButton targetProfileId={profile.id} />}
                {viewer && <BlockButton targetProfileId={profile.id} blocked={blocked} />}
              </>
            )}
          </div>
        </div>
        {profile.bio && <p className="mt-3 line-clamp-2 max-w-prose text-sm text-body">{profile.bio}</p>}
        {stats && <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">{stats}</div>}
      </div>
    </header>
  );

  // Perfil restrito (oculto ou só-amigos para não-amigo).
  if (!profile.canView) {
    return (
      <div className="container-page max-w-3xl py-8">
        {renderHeader()}
        <div className="card-base mt-6 flex flex-col items-center px-6 py-10 text-center">
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

  const [scraps, testimonials, friends, albums, communities] = await Promise.all([
    listScraps(profile.id),
    listApprovedTestimonials(profile.id),
    listFriends(profile.id),
    listAlbums(profile.id),
    listUserCommunities(profile.id),
  ]);

  const hasAbout = Boolean(d?.about || d?.interests || d?.relationship || d?.birth_date || d?.city);

  const statStrip = (
    <>
      <StatChip label="amigos" value={profile.friendCount} href={`/u/${slug}/amigos`} />
      <StatChip label="recados" value={scraps.length} href="#recados" />
      <StatChip label="depoimentos" value={testimonials.length} href="#depoimentos" />
      <StatChip label="fotos" value={albums.length} href="#fotos" />
      <StatChip label="comunidades" value={communities.length} href="#comunidades" />
    </>
  );

  // Navegação contextual (âncoras — sem novas rotas).
  const navItems: { href: string; label: string }[] = [
    ...(hasAbout ? [{ href: '#sobre', label: 'Sobre' }] : []),
    { href: '#recados', label: 'Recados' },
    { href: '#depoimentos', label: 'Depoimentos' },
    { href: '#amigos', label: 'Amigos' },
    { href: '#fotos', label: 'Fotos' },
    { href: '#comunidades', label: 'Comunidades' },
  ];

  return (
    <div className="container-page py-8">
      {renderHeader(statStrip)}

      <div className="mt-6 grid gap-6 lg:grid-cols-[200px_1fr_300px]">
        {/* Navegação contextual: barra segmentada no mobile, coluna sticky no desktop */}
        <nav aria-label="Seções do perfil" className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <ul className="no-scrollbar flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
            {navItems.map((it) => (
              <li key={it.href} className="shrink-0 lg:shrink">
                <a
                  href={it.href}
                  className="inline-flex min-h-[44px] w-full items-center whitespace-nowrap rounded-full border border-line bg-card px-4 text-sm font-bold text-body hover:bg-surface lg:rounded-[10px]"
                >
                  {it.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Coluna principal */}
        <div className="min-w-0 space-y-6">
          {hasAbout && (
            <section id="sobre" className="card-base scroll-mt-24 p-4 sm:p-5">
              <SectionHeading className="mb-3">Sobre</SectionHeading>
              {d?.about && <p className="mb-4 whitespace-pre-wrap text-sm text-body">{d.about}</p>}
              <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                <Field label="Relacionamento" value={d?.relationship} />
                {d?.birth_date && <Field label="Aniversário" value={formatDate(d.birth_date, "d 'de' MMMM")} />}
                <Field label="Cidade" value={d?.city} />
                <Field label="Interesses" value={d?.interests} full />
              </dl>
            </section>
          )}

          {/* Recados / mural */}
          <section id="recados" className="card-base scroll-mt-24 p-4 sm:p-5">
            <SectionHeading className="mb-3">Recados</SectionHeading>
            {isFriend && (
              <div className="mb-4">
                <ScrapForm profileId={profile.id} />
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
                          {s.author?.full_name ?? 'Usuário'}
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
            <SectionHeading className="mb-3">Depoimentos</SectionHeading>
            {isFriend && (
              <div className="mb-4">
                <TestimonialForm profileId={profile.id} />
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
                          {t.author?.full_name ?? 'Usuário'}
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
              <Link href="/comunidades" className="text-xs font-bold text-brand hover:underline">
                Explorar
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
