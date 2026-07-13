'use client';

import { useMemo } from 'react';
import Button from '@/components/Button';
import EmptyState from '@/components/EmptyState';
import Input from '@/components/Input';
import Select from '@/components/Select';
import StatusBadge from '@/components/StatusBadge';
import type { FinancialReportSummary, PagedContracts } from '@/features/commercial/queries';
import type { CommercialClientOption } from '@/features/commercial/types';
import { formatCurrency, formatDate } from '@/lib/utils/format';

function csvCell(value: string | number | null | undefined): string {
  const text = String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

export default function FinancialReport({
  summary,
  contracts,
  clients,
  filters,
  hasError,
}: {
  summary: FinancialReportSummary;
  contracts: PagedContracts;
  clients: CommercialClientOption[];
  filters: { period: string; startDate: string; endDate: string; clientId?: string; status?: string; financialStatus?: string };
  hasError: boolean;
}) {
  const csv = useMemo(() => [
    ['Número', 'Contrato', 'Cliente', 'Início', 'Fim', 'Status', 'Valor líquido', 'Recebido', 'Pendente', 'Em atraso', 'Próximo vencimento'],
    ...contracts.rows.map((contract) => [
      contract.contract_number, contract.title, contract.client_name, contract.start_date, contract.end_date,
      contract.status, contract.total_amount.toFixed(2), contract.paid_amount.toFixed(2),
      contract.pending_amount.toFixed(2), contract.overdue_amount.toFixed(2), contract.next_due_date,
    ]),
  ].map((row) => row.map(csvCell).join(';')).join('\n'), [contracts.rows]);

  function exportCsv() {
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `relatorio-comercial-${filters.startDate}-${filters.endDate}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-headline text-2xl font-extrabold text-title">Financeiro</h1>
          <p className="mt-1 text-sm text-muted">Valores contratados e recebíveis. O período usa o início do contrato para valores comerciais e o vencimento para parcelas.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={exportCsv} disabled={contracts.rows.length === 0}>Exportar CSV</Button>
      </header>

      <form method="get" className="card-base grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-5">
        <Select id="financial-period" name="periodo" label="Período" defaultValue={filters.period} options={[
          { value: 'mes_atual', label: 'Mês atual' }, { value: 'mes_anterior', label: 'Mês anterior' }, { value: 'ultimos_30', label: 'Últimos 30 dias' }, { value: 'trimestre', label: 'Trimestre atual' }, { value: 'ano_atual', label: 'Ano atual' }, { value: 'personalizado', label: 'Personalizado' },
        ]} />
        <Input id="financial-start" name="de" label="De" type="date" defaultValue={filters.startDate} />
        <Input id="financial-end" name="ate" label="Até" type="date" defaultValue={filters.endDate} />
        <Select id="financial-client" name="cliente" label="Cliente" defaultValue={filters.clientId ?? ''} placeholder="Todos os clientes" options={clients.map((client) => ({ value: client.id, label: client.trade_name ?? client.company_name ?? client.client_name }))} />
        <Select id="financial-status" name="financeiro" label="Status financeiro" defaultValue={filters.financialStatus ?? 'todos'} options={[
          { value: 'todos', label: 'Todos' }, { value: 'pendente', label: 'Pendente' }, { value: 'parcial', label: 'Parcial' }, { value: 'pago', label: 'Pago' }, { value: 'atrasado', label: 'Em atraso' },
        ]} />
        <div className="flex items-end gap-2 sm:col-span-2 xl:col-span-5"><Button type="submit" size="sm">Aplicar filtros</Button><Button href="/admin/comercial/financeiro" size="sm" variant="ghost">Limpar</Button><span className="ml-auto text-xs text-muted">{summary.contractsCount} contrato(s) · {summary.paymentsCount} parcela(s)</span></div>
      </form>

      {hasError && <p role="alert" className="rounded-[12px] bg-warning/10 px-3 py-2 text-sm text-body">Alguns indicadores não puderam ser carregados. Tente atualizar a página.</p>}

      <section aria-label="Indicadores financeiros" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Contratado bruto" value={formatCurrency(summary.grossContracted)} help="Subtotal dos itens" />
        <Metric label="Descontos" value={formatCurrency(summary.discounts)} help="Descontos do contrato" />
        <Metric label="Custos adicionais" value={formatCurrency(summary.additionalCosts)} help="Adicionais negociados" />
        <Metric label="Contratado líquido" value={formatCurrency(summary.netContracted)} help="Valor final dos contratos" tone="success" />
        <Metric label="Recebido" value={formatCurrency(summary.paidAmount)} help="Parcelas pagas" tone="success" />
        <Metric label="Pendente" value={formatCurrency(summary.pendingAmount)} help="Parcelas ainda no prazo" />
        <Metric label="Em atraso" value={formatCurrency(summary.overdueAmount)} help="Parcelas vencidas" tone={summary.overdueAmount > 0 ? 'danger' : undefined} />
        <Metric label="Ticket médio" value={formatCurrency(summary.averageContractValue)} help="Líquido por contrato" />
      </section>

      <section className="space-y-3" aria-labelledby="financial-contracts-heading">
        <div className="flex items-center justify-between"><h2 id="financial-contracts-heading" className="text-lg font-extrabold text-title">Contratos no período</h2><span className="text-xs text-muted">Tabela paginada · início da vigência como base</span></div>
        {contracts.rows.length === 0 ? <EmptyState title="Nenhum contrato encontrado para o período" description="Ajuste o intervalo ou os filtros para consultar outra base." /> : (
          <div className="card-base overflow-x-auto"><table className="w-full min-w-[1080px] text-sm"><thead className="bg-surface text-left text-xs text-muted"><tr><th className="p-3">Contrato</th><th className="p-3">Cliente</th><th className="p-3">Período</th><th className="p-3">Status</th><th className="p-3 text-right">Líquido</th><th className="p-3 text-right">Recebido</th><th className="p-3 text-right">Pendente</th><th className="p-3 text-right">Atrasado</th><th className="p-3">Próximo venc.</th></tr></thead><tbody className="divide-y divide-line">{contracts.rows.map((contract) => <tr key={contract.id}><td className="p-3"><a href={`/admin/comercial/contratos/${contract.id}`} className="font-bold text-title hover:text-brand hover:underline">{contract.title}</a><span className="block text-xs text-muted">{contract.contract_number ?? '—'}</span></td><td className="p-3 text-body">{contract.client_name}</td><td className="p-3 text-xs text-muted">{formatDate(contract.start_date, 'dd/MM/yy')} — {formatDate(contract.end_date, 'dd/MM/yy')}</td><td className="p-3"><StatusBadge status={contract.status} /></td><td className="p-3 text-right font-bold">{formatCurrency(contract.total_amount)}</td><td className="p-3 text-right text-brand-dark">{formatCurrency(contract.paid_amount)}</td><td className="p-3 text-right">{formatCurrency(contract.pending_amount)}</td><td className="p-3 text-right text-danger">{formatCurrency(contract.overdue_amount)}</td><td className="p-3 text-muted">{contract.next_due_date ? formatDate(contract.next_due_date, 'dd/MM/yy') : '—'}</td></tr>)}</tbody></table></div>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value, help, tone }: { label: string; value: string; help: string; tone?: 'success' | 'danger' }) {
  return <div className="card-base p-4"><p className="text-xs font-bold text-muted">{label}</p><p className={`mt-1 text-xl font-extrabold ${tone === 'success' ? 'text-brand-dark' : tone === 'danger' ? 'text-danger' : 'text-title'}`}>{value}</p><p className="mt-1 text-xs text-muted">{help}</p></div>;
}
