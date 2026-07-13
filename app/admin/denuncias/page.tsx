import EmptyState from '@/components/EmptyState';
import FilterTabs from '@/components/FilterTabs';
import ReportRowActions from '@/features/admin/ReportRowActions';
import { listReports } from '@/features/admin/communityQueries';
import { reportReasonLabel } from '@/lib/config/communities';
import { formatDateTime, titleCase } from '@/lib/utils/format';

export const dynamic = 'force-dynamic';

const tabs = [
  { label: 'Abertas', value: 'abertas' },
  { label: 'Todas', value: 'todas' },
];

const TARGET_LABEL: Record<string, string> = {
  comunidade: 'Comunidade',
  topico: 'Tópico',
  resposta: 'Resposta',
};

interface Props {
  searchParams: Promise<{ filtro?: string }>;
}

export default async function AdminReportsPage({ searchParams }: Props) {
  const { filtro = 'abertas' } = await searchParams;
  const reports = await listReports(filtro);

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold text-title">Denúncias de comunidades</h2>
      <p className="text-xs text-muted">
        Conteúdo denunciado pelos usuários. Remover o conteúdo também resolve a denúncia.
      </p>

      <FilterTabs tabs={tabs} current={filtro} basePath="/admin/denuncias" />

      {reports.length === 0 ? (
        <EmptyState title="Nenhuma denúncia nesta visão" />
      ) : (
        <ul className="space-y-2">
          {reports.map((r) => (
            <li key={r.id} className="card-base p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                    <span className="font-bold text-title">{TARGET_LABEL[r.target_type] ?? r.target_type}</span>
                    <span aria-hidden>·</span>
                    <span>{reportReasonLabel(r.reason)}</span>
                    <span aria-hidden>·</span>
                    <span>por {titleCase(r.reporter?.full_name) || 'Usuário'}</span>
                    <span aria-hidden>·</span>
                    <time dateTime={r.created_at}>{formatDateTime(r.created_at)}</time>
                    <span aria-hidden>·</span>
                    <span className="capitalize">{r.status}</span>
                  </div>
                  {r.details && <p className="text-sm text-body">{r.details}</p>}
                  <p className="mt-0.5 font-mono text-[11px] text-muted">alvo: {r.target_id}</p>
                </div>
                <ReportRowActions
                  reportId={r.id}
                  targetType={r.target_type}
                  targetId={r.target_id}
                  status={r.status}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
