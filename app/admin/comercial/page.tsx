import Link from 'next/link';
import Button from '@/components/Button';
import DashboardMetricCard from '@/components/DashboardMetricCard';
import { adminGuard } from '@/lib/auth/adminGuard';
import { formatCurrency, formatDateTime } from '@/lib/utils/format';

export const dynamic = 'force-dynamic';

function bahiaDate(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Bahia', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date).reduce<Record<string, string>>((result, part) => {
    result[part.type] = part.value;
    return result;
  }, {});
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function addDays(date: Date, days: number): string {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return bahiaDate(next);
}

function value(value: number | null | undefined): number {
  return Number.isFinite(value) ? Number(value) : 0;
}

function FinancialCard({ label, amount, description, href, tone }: { label: string; amount: number; description: string; href: string; tone?: 'success' | 'danger' | 'warning' }) {
  const color = tone === 'success' ? 'text-brand-dark' : tone === 'danger' ? 'text-danger' : tone === 'warning' ? 'text-warning' : 'text-title';
  return <Link href={href} className="card-base card-hover block p-4"><p className="text-xs font-bold text-muted">{label}</p><p className={`mt-1 text-xl font-extrabold ${color}`}>{formatCurrency(amount)}</p><p className="mt-2 text-xs text-muted">{description}</p></Link>;
}

export default async function CommercialOverviewPage() {
  const ctx = await adminGuard();
  if (!ctx) return null;
  const now = new Date();
  const today = bahiaDate(now);
  const in30 = addDays(now, 30);
  const [
    leadsResult, clientsResult, contractsResult, campaignsResult, paymentsResult,
    itemsResult, articlesResult, eventsResult, productsResult, placementsResult, historyResult,
  ] = await Promise.all([
    ctx.supabase.from('advertiser_contacts').select('id', { count: 'exact', head: true }).eq('status', 'novo'),
    ctx.supabase.from('commercial_clients').select('id', { count: 'exact', head: true }).eq('is_active', true),
    ctx.supabase.from('ad_contracts').select('id, title, status, start_date, end_date, total_amount, negotiated_value, renewal_enabled'),
    ctx.supabase.from('ad_campaigns').select('id, contract_id, status, desktop_media_url, end_at, placement'),
    ctx.supabase.from('contract_payments').select('id, contract_id, status, amount, paid_amount, due_date'),
    ctx.supabase.from('contract_items').select('id, contract_id, delivery_status'),
    ctx.supabase.from('sponsored_articles').select('id', { count: 'exact', head: true }).eq('is_active', true),
    ctx.supabase.from('sponsored_events').select('id', { count: 'exact', head: true }).eq('is_active', true),
    ctx.supabase.from('commercial_products').select('id', { count: 'exact', head: true }).eq('is_active', true),
    ctx.supabase.from('advertising_placements').select('id, code, maximum_active_items').eq('is_active', true),
    ctx.supabase.from('contract_history').select('id, contract_id, action, notes, created_at').order('created_at', { ascending: false }).limit(8),
  ]);
  const contracts = contractsResult.data ?? [];
  const campaigns = campaignsResult.data ?? [];
  const payments = paymentsResult.data ?? [];
  const items = itemsResult.data ?? [];

  const statusCount = (status: string) => contracts.filter((contract) => contract.status === status).length;
  const contractedValue = contracts.filter((contract) => !['cancelado', 'removido'].includes(contract.status)).reduce((sum, contract) => sum + value(contract.total_amount || contract.negotiated_value), 0);
  const activeValue = contracts.filter((contract) => contract.status === 'ativo').reduce((sum, contract) => sum + value(contract.total_amount || contract.negotiated_value), 0);
  let paid = 0;
  let pending = 0;
  let overdue = 0;
  let forecastMonth = 0;
  let forecast30 = 0;
  const month = today.slice(0, 7);
  for (const payment of payments) {
    const amount = value(payment.amount);
    const paidAmount = payment.status === 'pago' ? amount : value(payment.paid_amount);
    const outstanding = Math.max(0, amount - paidAmount);
    if (!['cancelado', 'estornado'].includes(payment.status)) paid += paidAmount;
    if (['cancelado', 'estornado'].includes(payment.status) || outstanding === 0) continue;
    if (payment.status === 'atrasado' || payment.due_date < today) overdue += outstanding;
    else pending += outstanding;
    if (payment.due_date.startsWith(month)) forecastMonth += outstanding;
    if (payment.due_date >= today && payment.due_date <= in30) forecast30 += outstanding;
  }
  const expiringContracts = contracts.filter((contract) => ['ativo', 'agendado'].includes(contract.status) && contract.end_date >= today && contract.end_date <= in30);
  const activeCampaigns = campaigns.filter((campaign) => campaign.status === 'ativa' && campaign.end_at >= now.toISOString()).length;
  const campaignsWithoutMedia = campaigns.filter((campaign) => ['aguardando_midia', 'em_revisao', 'agendada'].includes(campaign.status) && !campaign.desktop_media_url);
  const unconfiguredItems = items.filter((item) => item.delivery_status === 'nao_configurado');
  const usedByPlacement = new Map<string, number>();
  for (const campaign of campaigns) {
    if (['agendada', 'ativa'].includes(campaign.status)) usedByPlacement.set(campaign.placement, (usedByPlacement.get(campaign.placement) ?? 0) + 1);
  }
  const availablePlacements = (placementsResult.data ?? []).filter((placement) => (usedByPlacement.get(placement.code) ?? 0) < placement.maximum_active_items).length;
  const hasError = [leadsResult.error, clientsResult.error, contractsResult.error, campaignsResult.error, paymentsResult.error, itemsResult.error, articlesResult.error, eventsResult.error, productsResult.error, placementsResult.error, historyResult.error].some(Boolean);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="font-headline text-2xl font-extrabold text-title">Visão comercial</h1><p className="mt-1 text-sm text-muted">Operação, receita contratada e recebíveis sem misturar seus significados.</p></div><Button href="/admin/comercial/contratos/novo">Novo contrato</Button></header>
      {hasError && <p role="alert" className="rounded-[12px] bg-warning/10 px-3 py-2 text-sm text-body">Alguns indicadores não puderam ser carregados. Atualize a página para tentar novamente.</p>}

      <section aria-labelledby="overview-finance"><div className="mb-3 flex items-center justify-between"><h2 id="overview-finance" className="text-lg font-extrabold text-title">Resumo financeiro</h2><Link href="/admin/comercial/financeiro" className="text-sm font-bold text-brand hover:underline">Abrir financeiro →</Link></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><FinancialCard label="Valor contratado" amount={contractedValue} description="Valor líquido de contratos não cancelados." href="/admin/comercial/financeiro" /><FinancialCard label="Contratos ativos" amount={activeValue} description="Valor de acordos com status ativo." href="/admin/comercial/contratos?status=ativo" tone="success" /><FinancialCard label="Recebido" amount={paid} description="Soma efetivamente recebida nas parcelas." href="/admin/comercial/financeiro?financeiro=pago" tone="success" /><FinancialCard label="Em atraso" amount={overdue} description="Saldo de parcelas vencidas." href="/admin/comercial/financeiro?financeiro=atrasado" tone={overdue > 0 ? 'danger' : undefined} /><FinancialCard label="Pendente" amount={pending} description="Saldo ainda dentro do prazo." href="/admin/comercial/financeiro?financeiro=pendente" /><FinancialCard label="Previsão do mês" amount={forecastMonth} description="Parcelas com vencimento neste mês." href="/admin/comercial/financeiro?periodo=mes_atual" /><FinancialCard label="Próximos 30 dias" amount={forecast30} description="Parcelas a vencer nos próximos 30 dias." href="/admin/comercial/financeiro?periodo=ultimos_30" /><FinancialCard label="Ticket médio" amount={contracts.length ? contractedValue / contracts.length : 0} description="Valor contratado líquido por acordo." href="/admin/comercial/financeiro" /></div></section>

      <section aria-labelledby="overview-contracts"><h2 id="overview-contracts" className="mb-3 text-lg font-extrabold text-title">Contratos e campanhas</h2><div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><DashboardMetricCard label="Rascunhos" value={statusCount('rascunho')} href="/admin/comercial/contratos?status=rascunho" /><DashboardMetricCard label="Pendentes de aprovação" value={statusCount('pendente_aprovacao')} href="/admin/comercial/contratos?status=pendente_aprovacao" tone="warning" /><DashboardMetricCard label="Agendados" value={statusCount('agendado')} href="/admin/comercial/contratos?status=agendado" /><DashboardMetricCard label="Ativos" value={statusCount('ativo')} href="/admin/comercial/contratos?status=ativo" tone="success" /><DashboardMetricCard label="Vencendo em 30 dias" value={expiringContracts.length} href="/admin/comercial/contratos?status=vencendo" tone="warning" /><DashboardMetricCard label="Expirados" value={statusCount('expirado')} href="/admin/comercial/contratos?status=expirado" tone="danger" /><DashboardMetricCard label="Campanhas ativas" value={activeCampaigns} href="/admin/comercial/campanhas?status=ativa" tone="success" /><DashboardMetricCard label="Posições disponíveis" value={availablePlacements} href="/admin/comercial/produtos" /></div></section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]" aria-label="Alertas e atividade recente"><div className="card-base p-4"><h2 className="text-lg font-extrabold text-title">Alertas acionáveis</h2><div className="mt-3 space-y-2">{expiringContracts.length > 0 && <Alert href="/admin/comercial/contratos?status=vencendo" text={`${expiringContracts.length} contrato(s) vencem nos próximos 30 dias.`} tone="warning" />}{overdue > 0 && <Alert href="/admin/comercial/financeiro?financeiro=atrasado" text={`${formatCurrency(overdue)} em recebíveis vencidos.`} tone="danger" />}{campaignsWithoutMedia.length > 0 && <Alert href="/admin/comercial/campanhas?status=aguardando_midia" text={`${campaignsWithoutMedia.length} campanha(s) aguardam mídia desktop.`} tone="warning" />}{unconfiguredItems.length > 0 && <Alert href="/admin/comercial/contratos" text={`${unconfiguredItems.length} item(ns) de contrato ainda não foram configurados.`} tone="warning" />}{expiringContracts.length === 0 && overdue === 0 && campaignsWithoutMedia.length === 0 && unconfiguredItems.length === 0 && <p className="text-sm text-muted">Nenhum alerta operacional pendente.</p>}</div></div><div className="card-base p-4"><h2 className="text-lg font-extrabold text-title">Atividade recente</h2>{(historyResult.data ?? []).length === 0 ? <p className="mt-3 text-sm text-muted">Nenhuma atividade registrada ainda.</p> : <ol className="mt-3 space-y-3">{(historyResult.data ?? []).map((entry) => <li key={entry.id} className="border-b border-line pb-3 last:border-0 last:pb-0"><p className="font-semibold capitalize text-title">{entry.action.replaceAll('_', ' ')}</p>{entry.notes && <p className="mt-0.5 text-sm text-muted">{entry.notes}</p>}<time className="mt-1 block text-xs text-muted">{formatDateTime(entry.created_at)}</time></li>)}</ol>}</div></section>

      <section aria-label="Atalhos comerciais" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><DashboardMetricCard label="Leads novos" value={leadsResult.count ?? 0} href="/admin/comercial/leads" tone="warning" /><DashboardMetricCard label="Clientes ativos" value={clientsResult.count ?? 0} href="/admin/comercial/clientes" tone="success" /><DashboardMetricCard label="Conteúdos patrocinados" value={(articlesResult.count ?? 0) + (eventsResult.count ?? 0)} href="/admin/comercial/conteudo" /><DashboardMetricCard label="Produtos à venda" value={productsResult.count ?? 0} href="/admin/comercial/produtos" /></section>
    </div>
  );
}

function Alert({ href, text, tone }: { href: string; text: string; tone: 'warning' | 'danger' }) {
  return <Link href={href} className={`block rounded-[10px] px-3 py-2 text-sm font-semibold ${tone === 'danger' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'}`}>{text}</Link>;
}
