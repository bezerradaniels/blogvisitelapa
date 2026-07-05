import EmptyState from '@/components/EmptyState';
import { createClient } from '@/lib/supabase/server';
import { formatDateTime } from '@/lib/utils/format';

export const dynamic = 'force-dynamic';

interface AuditRow {
  id: string;
  action: string;
  entity: string | null;
  entity_id: string | null;
  created_at: string;
  actor: { full_name: string | null } | null;
}

export default async function AdminAuditoriaPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('audit_logs')
    .select('id, action, entity, entity_id, created_at, actor:profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(300);
  const logs = (data ?? []) as unknown as AuditRow[];

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold text-title">Auditoria</h2>
      {logs.length === 0 ? (
        <EmptyState title="Nenhum registro de auditoria ainda" />
      ) : (
        <div className="card-base overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left text-xs text-muted">
              <tr>
                <th className="p-3">Quando</th>
                <th className="p-3">Quem</th>
                <th className="p-3">Ação</th>
                <th className="p-3">Entidade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {logs.map((l) => (
                <tr key={l.id}>
                  <td className="p-3 text-muted">{formatDateTime(l.created_at)}</td>
                  <td className="p-3 text-body">{l.actor?.full_name ?? '—'}</td>
                  <td className="p-3 font-medium text-title">{l.action}</td>
                  <td className="p-3 text-muted">{l.entity ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
