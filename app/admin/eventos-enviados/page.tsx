import EmptyState from '@/components/EmptyState';
import FilterTabs from '@/components/FilterTabs';
import StatusBadge from '@/components/StatusBadge';
import EventSubmissionRowActions from '@/features/admin/EventSubmissionRowActions';
import { listAdminEventSubmissions } from '@/features/admin/queries';
import { formatDateTime } from '@/lib/utils/format';

export const dynamic = 'force-dynamic';

const tabs = [
  { label: 'Pendentes', value: 'pendentes' },
  { label: 'Aprovados', value: 'aprovado' },
  { label: 'Rejeitados', value: 'rejeitado' },
  { label: 'Todos', value: 'todos' },
];

interface Props { searchParams: Promise<{ filtro?: string }> }

export default async function AdminEventSubmissionsPage({ searchParams }: Props) {
  const { filtro = 'pendentes' } = await searchParams;
  const submissions = await listAdminEventSubmissions(filtro);

  return (
    <div className="space-y-4">
      <header><h2 className="text-base font-bold text-title">Eventos enviados</h2><p className="mt-1 text-sm text-muted">Revise e publique os eventos sugeridos pela comunidade.</p></header>
      <FilterTabs tabs={tabs} current={filtro} basePath="/admin/eventos-enviados" />
      {submissions.length === 0 ? <EmptyState title="Nenhum evento enviado" /> : (
        <div className="overflow-x-auto rounded-[10px] border border-line bg-card shadow-card"><table className="w-full text-sm"><thead className="bg-surface text-left text-xs text-muted"><tr><th className="p-3">Evento</th><th className="p-3">Data e local</th><th className="p-3">Enviado por</th><th className="p-3">Status</th><th className="p-3" /></tr></thead><tbody className="divide-y divide-line">{submissions.map((item) => <tr key={item.id} className="align-top"><td className="p-3"><p className="font-bold text-title">{item.title}</p><p className="mt-1 max-w-md whitespace-pre-line text-xs text-muted">{item.description}</p><p className="mt-2 text-xs text-muted">Organização: {item.event_organizer} · {item.event_is_free ? 'Gratuito' : item.event_ticket_price || 'Valor não informado'}</p></td><td className="p-3 text-xs text-body"><p>{formatDateTime(item.event_start_date)}</p><p className="mt-1">{item.event_location}</p>{item.event_address && <p className="mt-1 text-muted">{item.event_address}</p>}</td><td className="p-3 text-xs text-body"><p>{item.submitter_name ?? 'Conta do portal'}</p><p className="mt-1 text-muted">{item.submitter_email ?? '—'}</p><p className="mt-1 text-muted">{item.submitter_whatsapp ?? '—'}</p></td><td className="p-3"><StatusBadge status={item.status} /></td><td className="p-3"><EventSubmissionRowActions id={item.id} status={item.status} /></td></tr>)}</tbody></table></div>
      )}
    </div>
  );
}
