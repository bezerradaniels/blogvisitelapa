'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import StatusBadge from '@/components/StatusBadge';
import ContractFileUploader from '@/features/commercial/ContractFileUploader';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils/format';
import {
  markCommercialPaymentPaid,
  renewCommercialContract,
  transitionCommercialCampaign,
  transitionCommercialContract,
} from '@/features/commercial/actions';
import type { Tables } from '@/types/database';

type Tab = 'resumo' | 'itens' | 'entregaveis' | 'financeiro' | 'arquivos' | 'historico';

interface FinancialSummary {
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  cancelledAmount: number;
  refundedAmount: number;
  nextDueDate: string | null;
}

interface Props {
  data: {
    contract: Tables<'ad_contracts'>;
    client: Tables<'commercial_clients'> | null;
    brand: Tables<'commercial_brands'> | null;
    items: Tables<'contract_items'>[];
    campaigns: Tables<'ad_campaigns'>[];
    payments: Tables<'contract_payments'>[];
    files: Array<Tables<'contract_files'> & { downloadUrl: string | null }>;
    history: Tables<'contract_history'>[];
    financial: FinancialSummary;
  };
}

function daysUntil(date: string): number {
  return Math.ceil((new Date(`${date}T12:00:00`).getTime() - Date.now()) / 86_400_000);
}

function clientName(client: Tables<'commercial_clients'> | null): string {
  return client?.trade_name ?? client?.company_name ?? client?.client_name ?? 'Cliente não identificado';
}

function actionForStatus(status: string, endDate: string): { label: string; target: string } | null {
  const today = new Date().toISOString().slice(0, 10);
  if (status === 'rascunho') return { label: 'Enviar para aprovação', target: 'pendente_aprovacao' };
  if (status === 'pendente_aprovacao') return { label: 'Aprovar contrato', target: 'aprovado' };
  if (status === 'aprovado') return { label: endDate >= today ? 'Programar contrato' : 'Marcar como expirado', target: endDate >= today ? 'agendado' : 'expirado' };
  if (status === 'agendado') return { label: 'Ativar contrato', target: 'ativo' };
  if (status === 'ativo') return { label: 'Pausar contrato', target: 'pausado' };
  if (status === 'pausado') return { label: 'Reativar contrato', target: 'ativo' };
  return null;
}

export default function ContractDetail({ data }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('resumo');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { contract, client, brand, financial } = data;
  const statusAction = actionForStatus(contract.status, contract.end_date);
  const remainingDays = daysUntil(contract.end_date);

  function refreshResult(result: { ok: boolean; error?: string; warning?: string; id?: string }) {
    if (!result.ok) return setError(result.error ?? 'A operação não foi concluída.');
    setMessage(result.warning ?? 'Alteração salva com sucesso.');
    router.refresh();
  }

  function updateStatus(target: string) {
    if (target === 'cancelado' && !window.confirm('Cancelar este contrato também cancela as campanhas e itens ainda pendentes. Deseja continuar?')) return;
    setError(null);
    startTransition(async () => refreshResult(await transitionCommercialContract({ id: contract.id, status: target })));
  }

  function renew() {
    if (!window.confirm('Criar um novo rascunho de renovação sem reutilizar as mídias atuais?')) return;
    setError(null);
    startTransition(async () => {
      const result = await renewCommercialContract(contract.id);
      if (!result.ok) return setError(result.error);
      setMessage(result.warning ?? 'Rascunho de renovação criado.');
      if (result.id) router.push(`/admin/comercial/contratos/${result.id}`);
      router.refresh();
    });
  }

  function updateCampaign(id: string, status: string) {
    setError(null);
    startTransition(async () => refreshResult(await transitionCommercialCampaign({ id, status })));
  }

  function markPaid(id: string) {
    if (!window.confirm('Confirmar o recebimento integral desta parcela?')) return;
    setError(null);
    startTransition(async () => refreshResult(await markCommercialPaymentPaid({ id })));
  }

  const tabs: Array<{ id: Tab; label: string; count?: number }> = [
    { id: 'resumo', label: 'Resumo' },
    { id: 'itens', label: 'Itens', count: data.items.length },
    { id: 'entregaveis', label: 'Entregáveis', count: data.campaigns.length },
    { id: 'financeiro', label: 'Financeiro', count: data.payments.length },
    { id: 'arquivos', label: 'Arquivos', count: data.files.length },
    { id: 'historico', label: 'Histórico', count: data.history.length },
  ];

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-bold uppercase tracking-wide text-muted">{contract.contract_number ?? 'Contrato sem número'}</p>
            <StatusBadge status={contract.status} />
          </div>
          <h1 className="mt-1 font-headline text-2xl font-extrabold text-title">{contract.title}</h1>
          <p className="mt-1 text-sm text-muted">{clientName(client)}{brand ? ` · Marca: ${brand.name}` : ''}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {statusAction && <Button type="button" size="sm" onClick={() => updateStatus(statusAction.target)} disabled={pending}>{statusAction.label}</Button>}
          {!['cancelado', 'removido'].includes(contract.status) && <Button type="button" size="sm" variant="outline" onClick={renew} disabled={pending}>Renovar</Button>}
          {!['cancelado', 'removido', 'concluido'].includes(contract.status) && <Button type="button" size="sm" variant="danger" onClick={() => updateStatus('cancelado')} disabled={pending}>Cancelar</Button>}
        </div>
      </header>

      {error && <p role="alert" className="rounded-[12px] bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
      {message && <p role="status" className="rounded-[12px] bg-brand-soft px-3 py-2 text-sm text-brand-dark">{message}</p>}

      <nav aria-label="Seções do contrato" className="flex gap-1 overflow-x-auto rounded-[14px] border border-line bg-card p-1">
        {tabs.map((entry) => (
          <button key={entry.id} type="button" onClick={() => setTab(entry.id)} aria-current={tab === entry.id ? 'page' : undefined} className={`shrink-0 rounded-[10px] px-3 py-2 text-sm font-bold ${tab === entry.id ? 'bg-brand text-white' : 'text-muted hover:bg-surface'}`}>
            {entry.label}{entry.count !== undefined && <span className="ml-1 opacity-75">{entry.count}</span>}
          </button>
        ))}
      </nav>

      {tab === 'resumo' && (
        <section className="space-y-4" aria-label="Resumo do contrato">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Valor contratado" value={formatCurrency(contract.total_amount || contract.negotiated_value)} />
            <Metric label="Recebido" value={formatCurrency(financial.paidAmount)} tone="success" />
            <Metric label="Em aberto" value={formatCurrency(financial.pendingAmount + financial.overdueAmount)} tone={financial.overdueAmount > 0 ? 'danger' : undefined} />
            <Metric label="Prazo" value={remainingDays < 0 ? 'Vencido' : `${remainingDays} dia(s)`} tone={remainingDays >= 0 && remainingDays <= 30 ? 'warning' : undefined} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="card-base space-y-3 p-4">
              <h2 className="font-bold text-title">Vigência e aprovação</h2>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <Info label="Início" value={formatDate(contract.start_date, 'dd/MM/yyyy')} />
                <Info label="Término" value={formatDate(contract.end_date, 'dd/MM/yyyy')} />
                <Info label="Renovação" value={contract.renewal_enabled ? `Sim · ${contract.renewal_notice_days} dias antes` : 'Não automática'} />
                <Info label="Aprovado em" value={contract.approved_at ? formatDateTime(contract.approved_at) : 'Pendente'} />
              </dl>
              {contract.description && <p className="border-t border-line pt-3 text-sm text-body">{contract.description}</p>}
            </div>
            <div className="card-base space-y-3 p-4">
              <h2 className="font-bold text-title">Financeiro</h2>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <Info label="Subtotal" value={formatCurrency(contract.subtotal)} />
                <Info label="Desconto" value={contract.contract_discount_type ? `${contract.contract_discount_type === 'percentual' ? `${contract.contract_discount_value}%` : formatCurrency(contract.contract_discount_value)}` : '—'} />
                <Info label="Custos adicionais" value={formatCurrency(contract.additional_costs)} />
                <Info label="Próximo vencimento" value={financial.nextDueDate ? formatDate(financial.nextDueDate, 'dd/MM/yyyy') : '—'} />
              </dl>
              {contract.payment_terms && <p className="border-t border-line pt-3 text-sm text-body">{contract.payment_terms}</p>}
            </div>
          </div>
        </section>
      )}

      {tab === 'itens' && (
        <section className="space-y-3" aria-label="Itens do contrato">
          {data.items.length === 0 ? <EmptyMessage text="Este contrato ainda não possui itens." /> : data.items.map((item) => (
            <article key={item.id} className="card-base p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold text-title">{item.custom_name}</h2>
                  {item.description && <p className="mt-1 text-sm text-muted">{item.description}</p>}
                </div>
                <StatusBadge status={item.delivery_status} />
              </div>
              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-5">
                <Info label="Quantidade" value={String(item.quantity)} />
                <Info label="Unitário" value={formatCurrency(item.unit_price)} />
                <Info label="Desconto" value={formatCurrency(item.discount_amount)} />
                <Info label="Total" value={formatCurrency(item.line_total)} />
                <Info label="Período" value={item.start_date && item.end_date ? `${formatDate(item.start_date, 'dd/MM/yy')} — ${formatDate(item.end_date, 'dd/MM/yy')}` : 'Vigência do contrato'} />
              </dl>
              {(item.requires_media_upload || item.requires_content_creation || item.placement) && <p className="mt-3 text-xs text-muted">{item.placement ? `Placement: ${item.placement}. ` : ''}{item.requires_media_upload ? 'Exige mídia. ' : ''}{item.requires_content_creation ? 'Exige conteúdo patrocinado.' : ''}</p>}
            </article>
          ))}
        </section>
      )}

      {tab === 'entregaveis' && (
        <section className="space-y-3" aria-label="Campanhas e entregáveis">
          {data.campaigns.length === 0 ? <EmptyMessage text="Nenhuma campanha de publicidade foi configurada. Itens de conteúdo patrocinado podem ser vinculados pela área de conteúdo." /> : data.campaigns.map((campaign) => {
            const action = campaign.status === 'ativa' ? { label: 'Pausar', status: 'pausada' } : campaign.status === 'pausada' ? { label: 'Revisar', status: 'em_revisao' } : campaign.status === 'agendada' ? { label: 'Ativar', status: 'ativa' } : null;
            return (
              <article key={campaign.id} className="card-base p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-title">{campaign.campaign_name}</h2>
                    <p className="mt-1 text-sm text-muted">{campaign.placement} · {formatDateTime(campaign.start_at)} até {formatDateTime(campaign.end_at)}</p>
                  </div>
                  <div className="flex items-center gap-2"><StatusBadge status={campaign.status} />{action && <Button type="button" size="sm" variant="outline" onClick={() => updateCampaign(campaign.id, action.status)} disabled={pending}>{action.label}</Button>}</div>
                </div>
                <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
                  <Info label="Criativo desktop" value={campaign.desktop_media_url ? 'Enviado' : 'Pendente'} />
                  <Info label="Destino" value={campaign.destination_url ? 'Configurado' : 'Sem link'} />
                  <Info label="Prioridade" value={String(campaign.priority)} />
                </div>
              </article>
            );
          })}
        </section>
      )}

      {tab === 'financeiro' && (
        <section className="space-y-4" aria-label="Financeiro do contrato">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Contrato" value={formatCurrency(contract.total_amount || contract.negotiated_value)} />
            <Metric label="Recebido" value={formatCurrency(financial.paidAmount)} tone="success" />
            <Metric label="Pendente" value={formatCurrency(financial.pendingAmount)} />
            <Metric label="Em atraso" value={formatCurrency(financial.overdueAmount)} tone={financial.overdueAmount > 0 ? 'danger' : undefined} />
          </div>
          {data.payments.length === 0 ? <EmptyMessage text="Não há parcelas configuradas para este contrato." /> : (
            <div className="card-base overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-surface text-left text-xs text-muted"><tr><th className="p-3">Parcela</th><th className="p-3">Vencimento</th><th className="p-3">Forma</th><th className="p-3">Status</th><th className="p-3 text-right">Valor</th><th className="p-3" /></tr></thead>
                <tbody className="divide-y divide-line">
                  {data.payments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="p-3">{payment.installment_number}ª</td>
                      <td className="p-3">{formatDate(payment.due_date, 'dd/MM/yyyy')}</td>
                      <td className="p-3 text-muted">{payment.payment_method ?? '—'}</td>
                      <td className="p-3"><StatusBadge status={payment.status} /></td>
                      <td className="p-3 text-right font-bold">{formatCurrency(payment.amount)}</td>
                      <td className="p-3 text-right">{['pendente', 'parcial', 'atrasado'].includes(payment.status) && <Button type="button" size="sm" variant="outline" onClick={() => markPaid(payment.id)} disabled={pending}>Confirmar pagamento</Button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {tab === 'arquivos' && (
        <section aria-label="Arquivos do contrato">
          <ContractFileUploader contractId={contract.id} />
          {data.files.length === 0 ? <EmptyMessage text="Nenhum arquivo anexado. Envie contrato assinado, briefing, comprovante ou proposta pelo fluxo de arquivos." /> : (
            <div className="mt-3 space-y-2">{data.files.map((file) => file.downloadUrl ? <a key={file.id} href={file.downloadUrl} target="_blank" rel="noreferrer" className="card-base flex items-center justify-between gap-3 p-3 hover:border-brand"><span><b className="block text-title">{file.file_name ?? file.file_type}</b><span className="text-xs text-muted">{file.file_type} · {formatDateTime(file.created_at)}</span></span><span className="text-sm font-bold text-brand">Abrir</span></a> : <div key={file.id} className="card-base flex items-center justify-between gap-3 p-3"><span><b className="block text-title">{file.file_name ?? file.file_type}</b><span className="text-xs text-muted">Arquivo privado indisponível para assinatura.</span></span></div>)}</div>
          )}
        </section>
      )}

      {tab === 'historico' && (
        <section aria-label="Histórico do contrato">
          {data.history.length === 0 ? <EmptyMessage text="Nenhuma ação registrada ainda." /> : (
            <ol className="relative ml-2 space-y-4 border-l border-line pl-5">{data.history.map((entry) => <li key={entry.id}><span className="absolute -left-1.5 mt-1 h-3 w-3 rounded-full bg-brand" /><p className="font-bold text-title">{entry.action.replaceAll('_', ' ')}</p>{entry.notes && <p className="mt-1 text-sm text-body">{entry.notes}</p>}<time className="mt-1 block text-xs text-muted">{formatDateTime(entry.created_at)}</time></li>)}</ol>
          )}
        </section>
      )}
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: 'success' | 'warning' | 'danger' }) {
  const color = tone === 'success' ? 'text-brand-dark' : tone === 'warning' ? 'text-warning' : tone === 'danger' ? 'text-danger' : 'text-title';
  return <div className="card-base p-4"><span className="text-xs font-bold text-muted">{label}</span><strong className={`mt-1 block text-xl ${color}`}>{value}</strong></div>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs font-medium text-muted">{label}</dt><dd className="mt-0.5 font-semibold text-title">{value}</dd></div>;
}

function EmptyMessage({ text }: { text: string }) {
  return <div className="rounded-[14px] border border-dashed border-line p-5 text-sm text-muted">{text}</div>;
}
