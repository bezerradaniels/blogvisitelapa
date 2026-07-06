import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import EmptyState from '@/components/EmptyState';
import JoinButton from '@/features/communities/JoinButton';
import ReportButton from '@/features/communities/ReportButton';
import {
  getCommunityBySlug,
  getMembership,
  listMembers,
  listTopics,
} from '@/features/communities/queries';
import { getCurrentUser } from '@/lib/auth/session';
import { communityCategoryLabel } from '@/lib/config/communities';
import { buildMetadata } from '@/lib/seo/metadata';
import { timeAgo } from '@/lib/utils/format';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const community = await getCommunityBySlug(slug);
  if (!community) return buildMetadata({ title: 'Comunidade', noindex: true });
  return buildMetadata({
    title: community.name,
    description: community.description ?? `Comunidade ${community.name} no Conecta Lapa.`,
    path: `/comunidades/${slug}`,
    image: community.cover_image_url ?? community.avatar_url,
  });
}

export default async function ComunidadePage({ params }: Props) {
  const { slug } = await params;
  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  const [user, topics, members] = await Promise.all([
    getCurrentUser(),
    listTopics(community.id),
    listMembers(community.id),
  ]);
  const membership = await getMembership(community.id, user?.profile?.id ?? null);
  const isMember = Boolean(membership);
  const isModerator = membership?.role === 'dono' || membership?.role === 'moderador' || Boolean(user?.isAdmin);

  return (
    <div className="container-page py-8">
      {community.status !== 'ativa' && (
        <p className="card-base mb-4 bg-[#fbe0e3] p-3 text-sm font-semibold text-danger">
          Esta comunidade está {community.status}. Apenas moderadores a visualizam.
        </p>
      )}

      {/* Cabeçalho */}
      <header className="card-base mb-6 flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
        <span className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[18px] bg-brand-soft font-headline text-3xl font-extrabold text-brand-dark">
          {community.avatar_url ? (
            <Image src={community.avatar_url} alt="" fill sizes="80px" className="object-cover" />
          ) : (
            community.name.charAt(0).toUpperCase()
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold text-title">{community.name}</h1>
            <Badge tone="success">{communityCategoryLabel(community.category)}</Badge>
          </div>
          {community.description && <p className="text-sm text-muted">{community.description}</p>}
          <p className="mt-1 text-xs text-muted">
            {community.member_count} {community.member_count === 1 ? 'membro' : 'membros'} ·{' '}
            {community.topic_count} {community.topic_count === 1 ? 'tópico' : 'tópicos'}
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <JoinButton communityId={community.id} isMember={isMember} isLogged={Boolean(user)} />
          <div className="flex items-center gap-2">
            <Link href={`/comunidades/${slug}/membros`} className="text-xs font-bold text-brand hover:underline">
              Membros
            </Link>
            {isModerator && (
              <Link
                href={`/comunidades/${slug}/configuracoes`}
                className="text-xs font-bold text-brand hover:underline"
              >
                Configurações
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Tópicos */}
        <section className="min-w-0">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-title">
              <span className="leaf-pill" aria-hidden />
              Tópicos
            </h2>
            {isMember && (
              <Button href={`/comunidades/${slug}/topicos/novo`} variant="primary" size="sm">
                Novo tópico
              </Button>
            )}
          </div>

          {topics.length > 0 ? (
            <ul className="space-y-2">
              {topics.map((t) => (
                <li key={t.id} className="card-hover card-base p-3">
                  <Link href={`/comunidades/${slug}/topicos/${t.slug}`} className="block">
                    <div className="mb-1 flex items-center gap-2">
                      {t.is_pinned && <Badge tone="highlight">Fixado</Badge>}
                      {t.is_locked && <Badge tone="neutral">Fechado</Badge>}
                      <span className="truncate font-bold text-title">{t.title}</span>
                    </div>
                    <p className="text-xs text-muted">
                      por {t.author?.full_name ?? 'Membro'} · {timeAgo(t.last_activity_at)} ·{' '}
                      {t.reply_count} {t.reply_count === 1 ? 'resposta' : 'respostas'}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="Nenhum tópico ainda"
              description={isMember ? 'Seja o primeiro a começar uma conversa.' : 'Participe para criar o primeiro tópico.'}
              action={isMember ? <Button href={`/comunidades/${slug}/topicos/novo`}>Novo tópico</Button> : undefined}
            />
          )}
        </section>

        {/* Sidebar */}
        <aside className="space-y-4">
          {community.rules && (
            <div className="card-base p-4">
              <h3 className="mb-2 text-sm font-extrabold text-title">Regras</h3>
              <p className="whitespace-pre-wrap text-sm text-muted">{community.rules}</p>
            </div>
          )}
          <div className="card-base p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-title">Membros</h3>
              <Link href={`/comunidades/${slug}/membros`} className="text-xs font-bold text-brand hover:underline">
                Ver todos
              </Link>
            </div>
            <ul className="flex flex-wrap gap-2">
              {members.slice(0, 12).map((m) => (
                <li
                  key={m.id}
                  title={m.profile?.full_name ?? 'Membro'}
                  className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-brand-soft text-sm font-extrabold text-brand-dark"
                >
                  {m.profile?.avatar_url ? (
                    <Image src={m.profile.avatar_url} alt="" width={36} height={36} className="object-cover" />
                  ) : (
                    (m.profile?.full_name ?? 'M').charAt(0).toUpperCase()
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div className="card-base p-4">
            <ReportButton targetType="comunidade" targetId={community.id} />
          </div>
        </aside>
      </div>
    </div>
  );
}
