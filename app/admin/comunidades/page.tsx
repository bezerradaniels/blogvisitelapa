import Link from 'next/link';
import EmptyState from '@/components/EmptyState';
import FilterTabs from '@/components/FilterTabs';
import CommunityRowActions from '@/features/admin/CommunityRowActions';
import { listAdminCommunities } from '@/features/admin/communityQueries';
import { communityCategoryLabel } from '@/lib/config/communities';
import { formatDateTime } from '@/lib/utils/format';

export const dynamic = 'force-dynamic';

const tabs = [
  { label: 'Todas', value: 'todas' },
  { label: 'Ativas', value: 'ativas' },
  { label: 'Suspensas', value: 'suspensas' },
  { label: 'Removidas', value: 'removidas' },
];

interface Props {
  searchParams: Promise<{ filtro?: string }>;
}

export default async function AdminCommunitiesPage({ searchParams }: Props) {
  const { filtro = 'todas' } = await searchParams;
  const communities = await listAdminCommunities(filtro);

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold text-title">Comunidades</h2>
      <p className="text-xs text-muted">
        Comunidades são criadas livremente pelos usuários. A moderação aqui é reativa (suspender/remover).
      </p>

      <FilterTabs tabs={tabs} current={filtro} basePath="/admin/comunidades" />

      {communities.length === 0 ? (
        <EmptyState title="Nenhuma comunidade nesta visão" />
      ) : (
        <ul className="space-y-2">
          {communities.map((c) => (
            <li key={c.id} className="card-base p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                    <Link href={`/comunidades/${c.slug}`} className="font-bold text-title hover:underline">
                      {c.name}
                    </Link>
                    <span aria-hidden>·</span>
                    <span>{communityCategoryLabel(c.category)}</span>
                    <span aria-hidden>·</span>
                    <span>{c.member_count} membros · {c.topic_count} tópicos</span>
                    <span aria-hidden>·</span>
                    <span className="capitalize">{c.status}</span>
                  </div>
                  <p className="text-xs text-muted">
                    Dono: {c.owner?.full_name ?? '—'} · criada em {formatDateTime(c.created_at)}
                  </p>
                </div>
                <CommunityRowActions communityId={c.id} status={c.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
