import Button from '@/components/Button';
import EmptyState from '@/components/EmptyState';
import StatusBadge from '@/components/StatusBadge';
import ContractRowActions from '@/features/admin/ContractRowActions';
import { createClient } from '@/lib/supabase/server';
import { formatCurrency, formatDate } from '@/lib/utils/format';

export const dynamic = 'force-dynamic';

function daysUntil(dateStr: string): number {
  const end = new Date(dateStr);
  const now = new Date();
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default async function AdminContratosPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('ad_contracts')
    .select('*, client:commercial_clients(client_name)')
    .order('end_date', { ascending: true });
  const contracts = (data ?? []) as unknown as (Record<string, unknown> & {
    id: string; title: string; placement: string; status: string;
    start_date: string; end_date: string; negotiated_value: number | null;
    payment_status: string; company_name: string | null;
    client: { client_name: string } | null;
  })[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-title">Contratos de publicidade</h2>
        <Button href="/admin/contratos/novo" size="sm">Novo contrato</Button>
      </div>

      {contracts.length === 0 ? (
        <EmptyState title="Nenhum contrato cadastrado" action={<Button href="/admin/contratos/novo">Criar contrato</Button>} />
      ) : (
        <div className="card-base overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left text-xs text-muted">
              <tr>
                <th className="p-3">Anúncio</th>
                <th className="p-3">Posição</th>
                <th className="p-3">Período</th>
                <th className="p-3">Valor</th>
                <th className="p-3">Status</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {contracts.map((c) => {
                const remaining = daysUntil(c.end_date);
                const expiring = c.status === 'ativo' && remaining >= 0 && remaining <= 7;
                const expired = remaining < 0;
                return (
                  <tr key={c.id}>
                    <td className="p-3">
                      <span className="font-medium text-title">{c.title}</span>
                      <span className="block text-xs text-muted">
                        {c.client?.client_name ?? c.company_name ?? '—'}
                      </span>
                    </td>
                    <td className="p-3 text-muted">{c.placement}</td>
                    <td className="p-3 text-muted">
                      {formatDate(c.start_date)} → {formatDate(c.end_date)}
                      {expiring && <span className="block text-xs font-medium text-warning">vence em {remaining}d</span>}
                      {expired && c.status === 'ativo' && <span className="block text-xs font-medium text-danger">vencido</span>}
                    </td>
                    <td className="p-3 text-muted">{formatCurrency(c.negotiated_value)}</td>
                    <td className="p-3"><StatusBadge status={c.status} /></td>
                    <td className="p-3"><ContractRowActions id={c.id} status={c.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
