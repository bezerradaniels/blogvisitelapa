import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import EmptyState from '@/components/EmptyState';
import JoinButton from '@/features/communities/JoinButton';
import ReportButton from '@/features/communities/ReportButton';
import {
  getCommunityBySlug,
  getMembership,
  listCommunities,
  listMembers,
  listTopics,
} from '@/features/communities/queries';
import { listFriends } from '@/features/social/queries';
import { getCurrentUser } from '@/lib/auth/session';
import { communityCategoryLabel } from '@/lib/config/communities';
import { buildMetadata } from '@/lib/seo/metadata';
import { formatDate, timeAgo, titleCase } from '@/lib/utils/format';
import type { CommunityProfile } from '@/types/communities';

interface Props {
  params: Promise<{ slug: string }>;
}

const fmt = (n: number) => n.toLocaleString('pt-BR');

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const community = await getCommunityBySlug(slug);
  if (!community) return buildMetadata({ title: 'Comunidade', noindex: true });
  return buildMetadata({
    title: community.name,
    description: community.description ?? `Comunidade ${community.name} no Conecta Lapa.`,
    path: `/comunidades/${slug}`,
    image: community.avatar_url,
  });
}

/* ---------- helpers apresentacionais (server, inline) ---------- */

function Avatar({ url, name, size = 40, round }: { url: string | null; name: string | null; size?: number; round?: boolean }) {
  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden bg-brand-soft font-headline font-extrabold text-brand-dark ${round ? 'rounded-full' : 'rounded-[14px]'}`}
      style={{ width: size, height: size, fontSize: size / 2.5 }}
    >
      {url ? (
        <Image src={url} alt="" fill sizes={`${size}px`} className="object-cover" />
      ) : (
        (name ?? 'C').charAt(0).toUpperCase()
      )}
    </span>
  );
}

function SectionHeading({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={`flex items-center gap-2 text-base font-extrabold text-title${className ? ` ${className}` : ''}`}>
      <span className="leaf-pill" aria-hidden />
      {children}
    </h2>
  );
}

function MetaRow({ label, children }: { label: string; children: ReactNode }) {
  if (!children) return null;
  return (
    <div className="grid grid-cols-[110px_1fr] gap-3 py-2">
      <dt className="text-xs font-semibold text-muted">{label}</dt>
      <dd className="text-sm text-body">{children}</dd>
    </div>
  );
}

export default async function ComunidadePage({ params }: Props) {
  const { slug } = await params;
  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  const user = await getCurrentUser();
  const viewerId = user?.profile?.id ?? null;

  const [topics, members, membership, related, friends] = await Promise.all([
    listTopics(community.id),
    listMembers(community.id),
    getMembership(community.id, viewerId),
    listCommunities({ category: community.category }),
    viewerId ? listFriends(viewerId) : Promise.resolve([] as CommunityProfile[]),
  ]);

  const isMember = Boolean(membership);
  const isModerator = membership?.role === 'dono' || membership?.role === 'moderador' || Boolean(user?.isAdmin);

  const relatedCommunities = related.filter((c) => c.id !== community.id).slice(0, 6);
  const friendIds = new Set(friends.map((f) => f.id));
  const friendsInCommunity = members.filter((m) => m.profile && friendIds.has(m.profile.id)).length;

  const navBase =
    'flex min-h-[40px] items-center gap-2 rounded-[10px] px-3 text-sm font-bold transition-colors';

  return (
    <div className="container-page py-8">
      {community.status !== 'ativa' && (
        <div className="card-base mb-4 flex items-center gap-2 bg-[#fbe0e3] p-3">
          <Badge tone="danger">{community.status === 'suspensa' ? 'Suspensa' : 'Removida'}</Badge>
          <p className="text-sm font-semibold text-danger">Esta comunidade não está ativa. Apenas moderadores a visualizam.</p>
        </div>
      )}

      {/* Trilha */}
      <nav aria-label="Trilha" className="mb-4 flex flex-wrap items-center gap-1.5 text-xs font-semibold text-muted">
        <Link href="/" className="hover:text-brand">Início</Link>
        <span aria-hidden>›</span>
        <Link href="/comunidades" className="hover:text-brand">Comunidades</Link>
        <span aria-hidden>›</span>
        <span className="text-title">{community.name}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr_300px]">
        {/* ---------- Coluna esquerda: identidade + ações + menu ---------- */}
        <aside className="space-y-4">
          <div className="card-base p-4">
            <div className="flex flex-col items-center text-center">
              <Avatar url={community.avatar_url} name={community.name} size={96} />
              <h1 className="mt-3 text-lg font-extrabold leading-tight text-title">{community.name}</h1>
              <p className="mt-0.5 text-sm text-muted">{fmt(community.member_count)} {community.member_count === 1 ? 'membro' : 'membros'}</p>
            </div>

            <hr className="my-4 border-line" />

            <div className="flex flex-col items-center gap-3">
              <JoinButton communityId={community.id} isMember={isMember} isLogged={Boolean(user)} />
              <ReportButton targetType="comunidade" targetId={community.id} />
            </div>

            <hr className="my-4 border-line" />

            <nav aria-label="Seções da comunidade">
              <ul className="space-y-1">
                <li>
                  <a href="#forum" className={`${navBase} text-body hover:bg-surface`}>Fórum</a>
                </li>
                <li>
                  <span className={`${navBase} cursor-default text-muted`}>
                    Enquetes
                    <Badge tone="neutral" className="ml-auto">em breve</Badge>
                  </span>
                </li>
                <li>
                  <span className={`${navBase} cursor-default text-muted`}>
                    Eventos
                    <Badge tone="neutral" className="ml-auto">em breve</Badge>
                  </span>
                </li>
                <li>
                  <a href="#membros" className={`${navBase} text-body hover:bg-surface`}>Membros</a>
                </li>
                {isModerator && (
                  <li>
                    <Link href={`/comunidades/${slug}/configuracoes`} className={`${navBase} text-brand hover:bg-surface`}>
                      Configurações
                    </Link>
                  </li>
                )}
              </ul>
            </nav>
          </div>
        </aside>

        {/* ---------- Coluna do meio: informações + fórum ---------- */}
        <div className="min-w-0 space-y-6">
          {/* Informações */}
          <section className="card-base p-4 sm:p-5">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <SectionHeading>Sobre a comunidade</SectionHeading>
              <Badge tone="success" className="ml-auto">{communityCategoryLabel(community.category)}</Badge>
            </div>
            <dl className="divide-y divide-line">
              {community.description && <MetaRow label="Descrição">{community.description}</MetaRow>}
              <MetaRow label="Categoria">{communityCategoryLabel(community.category)}</MetaRow>
              {community.owner?.slug && (
                <MetaRow label="Dono">
                  <Link href={`/u/${community.owner.slug}`} className="font-bold text-brand hover:underline">
                    {titleCase(community.owner.full_name) || 'Membro'}
                  </Link>
                </MetaRow>
              )}
              <MetaRow label="Tipo">Pública</MetaRow>
              <MetaRow label="Privacidade">Aberta — qualquer pessoa pode participar</MetaRow>
              <MetaRow label="Criada em">{formatDate(community.created_at)}</MetaRow>
              <MetaRow label="Participação">
                {fmt(community.member_count)} {community.member_count === 1 ? 'membro' : 'membros'} ·{' '}
                {fmt(community.topic_count)} {community.topic_count === 1 ? 'tópico' : 'tópicos'}
              </MetaRow>
              {community.rules && <MetaRow label="Regras"><span className="whitespace-pre-wrap">{community.rules}</span></MetaRow>}
            </dl>
          </section>

          {/* Fórum */}
          <section id="forum" className="card-base scroll-mt-24 p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <SectionHeading>Fórum</SectionHeading>
              {isMember && (
                <Button href={`/comunidades/${slug}/topicos/novo`} variant="primary" size="sm">
                  Criar novo tópico
                </Button>
              )}
            </div>

            {topics.length > 0 ? (
              <ul className="divide-y divide-line">
                <li className="hidden grid-cols-[1fr_auto_auto] gap-4 pb-2 text-xs font-semibold uppercase tracking-wide text-muted sm:grid">
                  <span>Tópico</span>
                  <span className="w-16 text-right">Posts</span>
                  <span className="w-24 text-right">Último post</span>
                </li>
                {topics.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/comunidades/${slug}/topicos/${t.slug}`}
                      className="grid grid-cols-[1fr_auto] items-center gap-4 py-3 transition-colors hover:bg-surface sm:grid-cols-[1fr_auto_auto]"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        {t.is_pinned && <Badge tone="highlight">Fixado</Badge>}
                        {t.is_locked && <Badge tone="neutral">Fechado</Badge>}
                        <span className="truncate font-bold text-title">{t.title}</span>
                      </div>
                      <span className="w-16 text-right text-sm text-muted">
                        <span className="sm:hidden">{fmt(t.reply_count)} posts · </span>
                        <span className="hidden sm:inline">{fmt(t.reply_count)}</span>
                      </span>
                      <span className="hidden w-24 text-right text-xs text-muted sm:inline">{timeAgo(t.last_activity_at)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="Nenhum tópico ainda"
                description={isMember ? 'Seja o primeiro a começar uma conversa.' : 'Participe para criar o primeiro tópico.'}
                action={isMember ? <Button href={`/comunidades/${slug}/topicos/novo`}>Criar novo tópico</Button> : undefined}
              />
            )}
          </section>
        </div>

        {/* ---------- Coluna direita: membros + relacionadas ---------- */}
        <aside className="space-y-6">
          <div id="membros" className="card-base scroll-mt-24 p-4">
            <div className="mb-1 flex items-center justify-between">
              <SectionHeading>Membros ({fmt(community.member_count)})</SectionHeading>
              <Link href={`/comunidades/${slug}/membros`} className="text-xs font-bold text-brand hover:underline">
                Ver todos
              </Link>
            </div>
            {friendsInCommunity > 0 && (
              <p className="mb-3 text-xs font-semibold text-brand-dark">
                {friendsInCommunity} {friendsInCommunity === 1 ? 'amigo participa' : 'amigos participam'}
              </p>
            )}
            {members.length > 0 ? (
              <div className="mt-3 grid grid-cols-3 items-start gap-3">
                {members.slice(0, 9).map((m) => (
                  <Link
                    key={m.id}
                    href={m.profile?.slug ? `/u/${m.profile.slug}` : '#'}
                    className="card-hover flex flex-col items-center gap-1.5 text-center"
                    title={titleCase(m.profile?.full_name) || 'Membro'}
                  >
                    <Avatar url={m.profile?.avatar_url ?? null} name={m.profile?.full_name ?? null} size={64} round />
                    <span className="w-full break-words text-xs font-semibold leading-tight text-title">
                      {titleCase(m.profile?.full_name) || 'Membro'}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">Ainda sem membros.</p>
            )}
          </div>

          {relatedCommunities.length > 0 && (
            <div className="card-base p-4">
              <div className="mb-3 flex items-center justify-between">
                <SectionHeading>Relacionadas</SectionHeading>
                <Link href={`/comunidades?categoria=${community.category}`} className="text-xs font-bold text-brand hover:underline">
                  Ver todas
                </Link>
              </div>
              <div className="grid grid-cols-3 items-start gap-3">
                {relatedCommunities.map((c) => (
                  <Link
                    key={c.id}
                    href={`/comunidades/${c.slug}`}
                    className="card-hover flex flex-col items-center gap-1.5 text-center"
                    title={c.name}
                  >
                    <Avatar url={c.avatar_url} name={c.name} size={64} />
                    <span className="w-full break-words text-xs font-semibold leading-tight text-title">{c.name}</span>
                    <span className="text-[11px] text-muted">{fmt(c.member_count)}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
