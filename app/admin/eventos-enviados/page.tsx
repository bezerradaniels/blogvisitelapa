import AdminPageHeader from '@/components/AdminPageHeader';
import AdminStatusNav from '@/components/AdminStatusNav';
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
    <div className="admin-page space-y-4">
      <AdminPageHeader title="Eventos enviados" description="Revise e publique os eventos sugeridos pela comunidade." />
      <AdminStatusNav items={tabs} current={filtro} basePath="/admin/eventos-enviados" />
      <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Evento</th><th className="admin-column-category">Data e local</th><th className="admin-column-author">Enviado por</th><th>Status</th></tr></thead><tbody>{submissions.length === 0 && <tr><td colSpan={4}>Nenhum evento enviado.</td></tr>}{submissions.map((item) => <tr key={item.id}><td className="admin-title-column"><p className="admin-title-link">{item.title}</p><p className="mt-1 max-w-md whitespace-pre-line text-xs text-muted">{item.description}</p><p className="mt-1 text-xs text-muted">Organização: {item.event_organizer} · {item.event_is_free ? 'Gratuito' : item.event_ticket_price || 'Valor não informado'}</p><div className="mt-1"><EventSubmissionRowActions id={item.id} status={item.status} /></div></td><td className="admin-column-category text-xs"><p>{formatDateTime(item.event_start_date)}</p><p>{item.event_location}</p>{item.event_address && <p className="text-muted">{item.event_address}</p>}</td><td className="admin-column-author text-xs"><p>{item.submitter_name ?? 'Conta do portal'}</p><p className="text-muted">{item.submitter_email ?? '—'}</p></td><td><StatusBadge status={item.status} /></td></tr>)}</tbody></table></div>
    </div>
  );
}
