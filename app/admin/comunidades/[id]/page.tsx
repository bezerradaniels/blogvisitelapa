import Link from 'next/link';
import { notFound } from 'next/navigation';
import Badge from '@/components/Badge';
import CommunityRowActions from '@/features/admin/CommunityRowActions';
import { getAdminCommunityDetails } from '@/features/admin/communityQueries';
import CommunityForm from '@/features/communities/CommunityForm';
import { getCurrentUser } from '@/lib/auth/session';
import { communityCategoryLabel } from '@/lib/config/communities';
import { formatDateTime, titleCase } from '@/lib/utils/format';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminCommunityDetailPage({ params }: Props) {
  const { id } = await params;
  const [details, current] = await Promise.all([
    getAdminCommunityDetails(id),
    getCurrentUser(),
  ]);
  if (!details || !current) notFound();

  const { community, members, topics, reportCount, openReportCount, replyCount } = details;
  const metrics = [
    ['Membros', community.member_count],
    ['Tópicos', community.topic_count],
    ['Respostas', replyCount],
    ['Denúncias da comunidade', reportCount],
    ['Denúncias abertas', openReportCount],
  ] as const;

  return (
    <div className="space-y-5">
      <nav className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/comunidades" className="text-sm font-semibold text-brand hover:underline">
          ← Voltar para comunidades
        </Link>
        <Link href={`/comunidades/${community.slug}`} className="text-sm font-semibold text-brand hover:underline">
          Ir para a comunidade →
        </Link>
      </nav>

      <header className="card-base space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-extrabold text-title">{community.name}</h2>
              <Badge tone={community.status === 'ativa' ? 'success' : community.status === 'suspensa' ? 'warning' : 'danger'}>
                {community.status === 'ativa' ? 'Ativa' : community.status === 'suspensa' ? 'Suspensa' : 'Removida'}
              </Badge>
            </div>
            <p className="text-sm text-muted">
              {communityCategoryLabel(community.category)} · criada em {formatDateTime(community.created_at)}
            </p>
          </div>
          <CommunityRowActions communityId={community.id} status={community.status} />
        </div>
      </header>

      <section>
        <h3 className="mb-3 font-bold text-title">Visão geral</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {metrics.map(([label, value]) => (
            <div key={label} className="card-base p-4">
              <p className="text-xs font-semibold text-muted">{label}</p>
              <p className="mt-1 text-2xl font-extrabold text-title">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card-base p-4 sm:p-5">
          <h3 className="mb-4 font-bold text-title">Informações</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-muted">Dono</dt><dd className="text-right text-title">{titleCase(community.owner?.full_name) || '—'}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">Categoria</dt><dd className="text-right text-title">{communityCategoryLabel(community.category)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">Endereço público</dt><dd className="text-right text-title">/comunidades/{community.slug}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">Atualizada em</dt><dd className="text-right text-title">{formatDateTime(community.updated_at)}</dd></div>
          </dl>
          {community.owner && (
            <div className="mt-4 flex flex-wrap gap-3 border-t border-line pt-4 text-sm font-semibold">
              <Link href={`/admin/usuarios/${community.owner.id}`} className="text-brand hover:underline">
                Ver detalhes do dono →
              </Link>
              {community.owner.slug && (
                <Link href={`/u/${community.owner.slug}`} className="text-brand hover:underline">
                  Ir para o perfil →
                </Link>
              )}
            </div>
          )}
        </section>

        <section className="card-base p-4 sm:p-5">
          <h3 className="mb-4 font-bold text-title">Conteúdo atual</h3>
          <p className="text-sm text-body">{community.description || 'Sem descrição.'}</p>
          {community.rules && (
            <div className="mt-4 border-t border-line pt-4">
              <p className="mb-1 text-xs font-semibold text-muted">Regras</p>
              <p className="whitespace-pre-wrap text-sm text-body">{community.rules}</p>
            </div>
          )}
        </section>
      </div>

      <section className="card-base p-4 sm:p-5">
        <h3 className="mb-4 font-bold text-title">Editar comunidade</h3>
        <CommunityForm
          userId={current.userId}
          redirectTo={`/admin/comunidades/${community.id}`}
          cancelHref="/admin/comunidades"
          community={{
            id: community.id,
            name: community.name,
            category: community.category,
            description: community.description,
            rules: community.rules,
            avatar_url: community.avatar_url,
            cover_image_url: community.cover_image_url,
          }}
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="card-base overflow-hidden">
          <h3 className="border-b border-line p-4 font-bold text-title">Membros</h3>
          {members.length === 0 ? (
            <p className="p-4 text-sm text-muted">Nenhum membro encontrado.</p>
          ) : (
            <div className="divide-y divide-line">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                  <div>
                    <p className="font-semibold text-title">{titleCase(member.profile?.full_name) || 'Usuário removido'}</p>
                    <p className="text-xs text-muted">Entrou em {formatDateTime(member.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={member.role === 'dono' ? 'brand' : member.role === 'moderador' ? 'info' : 'neutral'}>
                      {member.role}
                    </Badge>
                    {member.profile && (
                      <Link href={`/admin/usuarios/${member.profile.id}`} className="text-xs font-semibold text-brand hover:underline">
                        Detalhes
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card-base overflow-hidden">
          <h3 className="border-b border-line p-4 font-bold text-title">Tópicos recentes</h3>
          {topics.length === 0 ? (
            <p className="p-4 text-sm text-muted">Nenhum tópico publicado.</p>
          ) : (
            <div className="divide-y divide-line">
              {topics.map((topic) => (
                <div key={topic.id} className="p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/comunidades/${community.slug}/topicos/${topic.slug}`}
                      className="font-semibold text-title hover:text-brand hover:underline"
                    >
                      {topic.title}
                    </Link>
                    {topic.is_pinned && <Badge tone="highlight">Fixado</Badge>}
                    {topic.is_locked && <Badge tone="warning">Fechado</Badge>}
                    {topic.status === 'removido' && <Badge tone="danger">Removido</Badge>}
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {titleCase(topic.author?.full_name) || 'Autor removido'} · {topic.reply_count} respostas · atividade em {formatDateTime(topic.last_activity_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
