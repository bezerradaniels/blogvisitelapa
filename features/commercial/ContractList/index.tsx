import Link from 'next/link';
import Button from '@/components/Button';
import EmptyState from '@/components/EmptyState';
import Input from '@/components/Input';
import Select from '@/components/Select';
import StatusBadge from '@/components/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import type { ContractListFilters, PagedContracts } from '@/features/commercial/queries';
import type { CommercialClientOption } from '@/features/commercial/types';

function daysUntil(endDate: string): number {
  const today = new Date();
  const end = new Date(`${endDate}T12:00:00`);
  return Math.ceil((end.getTime() - today.getTime()) / 86_400_000);
}

function pageHref(filters: ContractListFilters, page: number): string {
  const params = new URLSearchParams();
  if (filters.query) params.set('q', filters.query);
  if (filters.status && filters.status !== 'todos') params.set('status', filters.status);
  if (filters.clientId) params.set('cliente', filters.clientId);
  if (filters.financialStatus && filters.financialStatus !== 'todos') params.set('financeiro', filters.financialStatus);
  if (page > 1) params.set('pagina', String(page));
  const search = params.toString();
  return `/admin/comercial/contratos${search ? `?${search}` : ''}`;
}

export default function ContractList({
  result,
  filters,
  clients,
}: {
  result: PagedContracts;
  filters: ContractListFilters;
  clients: CommercialClientOption[];
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-headline text-2xl font-extrabold text-title">Contratos</h1>
          <p className="mt-1 text-sm text-muted">Acordos comerciais, itens, entregáveis e recebíveis.</p>
        </div>
        <Button href="/admin/comercial/contratos/novo">Novo contrato</Button>
      </div>

      <form className="card-base grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-5" method="get">
        <Input
          id="contract-search"
          name="q"
          label="Buscar"
          defaultValue={filters.query}
          placeholder="Número ou título"
          className="xl:col-span-2"
        />
        <Select
          id="contract-status"
          name="status"
          label="Status do contrato"
          defaultValue={filters.status ?? 'todos'}
          options={[
            { value: 'todos', label: 'Todos' },
            { value: 'rascunho', label: 'Rascunho' },
            { value: 'pendente_aprovacao', label: 'Pendente de aprovação' },
            { value: 'aprovado', label: 'Aprovado' },
            { value: 'agendado', label: 'Agendado' },
            { value: 'ativo', label: 'Ativo' },
            { value: 'pausado', label: 'Pausado' },
            { value: 'vencendo', label: 'Vencendo em 30 dias' },
            { value: 'expirado', label: 'Expirado' },
            { value: 'concluido', label: 'Concluído' },
            { value: 'cancelado', label: 'Cancelado' },
          ]}
        />
        <Select
          id="contract-client"
          name="cliente"
          label="Cliente"
          defaultValue={filters.clientId ?? ''}
          placeholder="Todos os clientes"
          options={clients.map((client) => ({
            value: client.id,
            label: client.trade_name ?? client.company_name ?? client.client_name,
          }))}
        />
        <Select
          id="contract-financial"
          name="financeiro"
          label="Financeiro"
          defaultValue={filters.financialStatus ?? 'todos'}
          options={[
            { value: 'todos', label: 'Todos' },
            { value: 'pendente', label: 'Pendente' },
            { value: 'parcial', label: 'Parcial' },
            { value: 'pago', label: 'Pago' },
            { value: 'atrasado', label: 'Em atraso' },
          ]}
        />
        <div className="flex items-end gap-2 sm:col-span-2 xl:col-span-5">
          <Button type="submit" size="sm">Aplicar filtros</Button>
          <Button href="/admin/comercial/contratos" size="sm" variant="ghost">Limpar</Button>
          <span className="ml-auto text-xs text-muted">{result.total} contrato(s) encontrado(s)</span>
        </div>
      </form>

      {result.hasError && (
        <div role="alert" className="rounded-[14px] border border-warning bg-warning/5 p-3 text-sm text-body">
          Não foi possível carregar todos os dados financeiros. Atualize a página para tentar novamente.
        </div>
      )}

      {result.rows.length === 0 ? (
        <EmptyState
          title="Nenhum contrato encontrado"
          description="Ajuste os filtros ou crie o primeiro acordo comercial."
          action={<Button href="/admin/comercial/contratos/novo">Criar contrato</Button>}
        />
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {result.rows.map((contract) => {
              const remaining = daysUntil(contract.end_date);
              return (
                <Link
                  key={contract.id}
                  href={`/admin/comercial/contratos/${contract.id}`}
                  className="card-base block p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-muted">{contract.contract_number ?? 'Sem número'}</p>
                      <p className="mt-1 font-bold text-title">{contract.title}</p>
                      <p className="mt-1 text-sm text-muted">{contract.client_name}</p>
                    </div>
                    <StatusBadge status={contract.status} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 border-t border-line pt-3 text-sm">
                    <span><b className="block text-xs text-muted">Valor</b>{formatCurrency(contract.total_amount)}</span>
                    <span><b className="block text-xs text-muted">Saldo</b>{formatCurrency(contract.pending_amount + contract.overdue_amount)}</span>
                    <span><b className="block text-xs text-muted">Termina</b>{formatDate(contract.end_date, 'dd/MM/yyyy')}</span>
                    <span className={remaining <= 30 && remaining >= 0 ? 'text-warning' : ''}>
                      <b className="block text-xs text-muted">Prazo</b>
                      {remaining < 0 ? 'Vencido' : `${remaining} dia(s)`}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="card-base hidden overflow-x-auto md:block">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="bg-surface text-left text-xs text-muted">
                <tr>
                  <th className="p-3">Contrato</th>
                  <th className="p-3">Cliente / marca</th>
                  <th className="p-3">Período</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Financeiro</th>
                  <th className="p-3 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {result.rows.map((contract) => {
                  const remaining = daysUntil(contract.end_date);
                  return (
                    <tr key={contract.id} className="hover:bg-surface/50">
                      <td className="p-3">
                        <Link href={`/admin/comercial/contratos/${contract.id}`} className="font-bold text-title hover:text-brand hover:underline">
                          {contract.title}
                        </Link>
                        <span className="mt-0.5 block text-xs text-muted">{contract.contract_number ?? 'Sem número'}</span>
                      </td>
                      <td className="p-3 text-body">
                        {contract.client_name}
                        {contract.advertiser_name && <span className="block text-xs text-muted">Marca: {contract.advertiser_name}</span>}
                      </td>
                      <td className="p-3 text-muted">
                        {formatDate(contract.start_date, 'dd/MM/yy')} — {formatDate(contract.end_date, 'dd/MM/yy')}
                        <span className={remaining <= 30 && remaining >= 0 ? 'mt-0.5 block text-xs text-warning' : 'mt-0.5 block text-xs'}>
                          {remaining < 0 ? 'Vencido' : `${remaining} dia(s) restantes`}
                        </span>
                      </td>
                      <td className="p-3"><StatusBadge status={contract.status} /></td>
                      <td className="p-3 text-xs text-muted">
                        <span className="block">Recebido: {formatCurrency(contract.paid_amount)}</span>
                        <span className={contract.overdue_amount > 0 ? 'block text-danger' : 'block'}>
                          {contract.overdue_amount > 0 ? `Em atraso: ${formatCurrency(contract.overdue_amount)}` : `Pendente: ${formatCurrency(contract.pending_amount)}`}
                        </span>
                      </td>
                      <td className="p-3 text-right font-bold text-title">{formatCurrency(contract.total_amount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {result.pageCount > 1 && (
        <nav aria-label="Paginação de contratos" className="flex items-center justify-center gap-2">
          <Button href={pageHref(filters, Math.max(1, result.page - 1))} size="sm" variant="outline" aria-disabled={result.page === 1}>
            Anterior
          </Button>
          <span className="text-sm text-muted">Página {result.page} de {result.pageCount}</span>
          <Button href={pageHref(filters, Math.min(result.pageCount, result.page + 1))} size="sm" variant="outline" aria-disabled={result.page === result.pageCount}>
            Próxima
          </Button>
        </nav>
      )}
    </div>
  );
}
