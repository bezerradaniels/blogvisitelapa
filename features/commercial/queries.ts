import 'server-only';

import { createClient } from '@/lib/supabase/server';
import type {
  AdContractStatus,
  CampaignStatus,
  Tables,
} from '@/types/database';
import type {
  CommercialBrandOption,
  CommercialClientOption,
  CommercialPlacementOption,
  CommercialProductOption,
  ContractFinancialSummary,
  ContractListRow,
} from './types';

export const COMMERCIAL_PAGE_SIZE = 20;

type ContractRow = Tables<'ad_contracts'>;
type PaymentRow = Tables<'contract_payments'>;

export interface CommercialReferences {
  clients: CommercialClientOption[];
  brands: CommercialBrandOption[];
  products: CommercialProductOption[];
  placements: CommercialPlacementOption[];
  hasError: boolean;
}

export interface ContractListFilters {
  page?: number;
  query?: string;
  status?: string;
  clientId?: string;
  financialStatus?: string;
  startDate?: string;
  endDate?: string;
}

export interface PagedContracts {
  rows: ContractListRow[];
  page: number;
  pageCount: number;
  total: number;
  hasError: boolean;
}

export interface ContractDetail {
  contract: ContractRow;
  client: Tables<'commercial_clients'> | null;
  brand: Tables<'commercial_brands'> | null;
  items: Tables<'contract_items'>[];
  campaigns: Tables<'ad_campaigns'>[];
  payments: PaymentRow[];
  files: CommercialContractFile[];
  history: Tables<'contract_history'>[];
  financial: ContractFinancialSummary;
}

export type CommercialContractFile = Tables<'contract_files'> & { downloadUrl: string | null };

export interface CampaignListFilters {
  page?: number;
  status?: string;
  placement?: string;
}

export interface CampaignListRow extends Tables<'ad_campaigns'> {
  contract_number: string | null;
  contract_title: string;
  client_name: string;
}

export interface PagedCampaigns {
  rows: CampaignListRow[];
  total: number;
  page: number;
  pageCount: number;
  hasError: boolean;
}

function toNumber(value: number | null | undefined): number {
  return Number.isFinite(value) ? Number(value) : 0;
}

function todayInBahia(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bahia',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function summarizePayments(payments: PaymentRow[], today = todayInBahia()): ContractFinancialSummary {
  let paidAmount = 0;
  let pendingAmount = 0;
  let overdueAmount = 0;
  let cancelledAmount = 0;
  let refundedAmount = 0;
  let nextDueDate: string | null = null;

  for (const payment of payments) {
    const amount = toNumber(payment.amount);
    const paid = Math.min(amount, Math.max(0, toNumber(payment.paid_amount)));
    if (payment.status === 'cancelado') {
      cancelledAmount += amount;
      continue;
    }
    if (payment.status === 'estornado') {
      refundedAmount += amount;
      continue;
    }
    paidAmount += payment.status === 'pago' ? amount : paid;
    const outstanding = Math.max(0, amount - (payment.status === 'pago' ? amount : paid));
    if (outstanding === 0) continue;

    if (payment.status === 'atrasado' || payment.due_date < today) overdueAmount += outstanding;
    else pendingAmount += outstanding;

    if (payment.status !== 'atrasado' && (!nextDueDate || payment.due_date < nextDueDate)) {
      nextDueDate = payment.due_date;
    }
  }

  return {
    totalAmount: paidAmount + pendingAmount + overdueAmount + cancelledAmount + refundedAmount,
    paidAmount,
    pendingAmount,
    overdueAmount,
    cancelledAmount,
    refundedAmount,
    nextDueDate,
  };
}

function financialStatusMatches(summary: ContractFinancialSummary, status?: string): boolean {
  if (!status || status === 'todos') return true;
  if (status === 'atrasado') return summary.overdueAmount > 0;
  if (status === 'pago') return summary.paidAmount > 0 && summary.pendingAmount === 0 && summary.overdueAmount === 0;
  if (status === 'pendente') return summary.pendingAmount > 0;
  if (status === 'parcial') return summary.paidAmount > 0 && (summary.pendingAmount > 0 || summary.overdueAmount > 0);
  return true;
}

export async function getCommercialReferences(): Promise<CommercialReferences> {
  const supabase = await createClient();
  const [clientsResult, brandsResult, productsResult, placementsResult] = await Promise.all([
    supabase
      .from('commercial_clients')
      .select('id, client_name, trade_name, company_name, email, whatsapp, document, is_active')
      .eq('is_active', true)
      .order('client_name'),
    supabase
      .from('commercial_brands')
      .select('id, client_id, name, is_active')
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('commercial_products')
      .select('id, name, default_price, placement_id, requires_media_upload, requires_content_creation, is_recurring')
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('advertising_placements')
      .select('id, code, name, desktop_dimensions, mobile_dimensions')
      .eq('is_active', true)
      .order('name'),
  ]);

  const placements = (placementsResult.data ?? []) as CommercialPlacementOption[];
  const placementById = new Map(placements.map((placement) => [placement.id, placement]));

  return {
    clients: (clientsResult.data ?? []) as CommercialClientOption[],
    brands: (brandsResult.data ?? []) as CommercialBrandOption[],
    products: (productsResult.data ?? []).map((product) => ({
      ...product,
      placement_code: product.placement_id ? placementById.get(product.placement_id)?.code ?? null : null,
    })) as CommercialProductOption[],
    placements,
    hasError: Boolean(clientsResult.error || brandsResult.error || productsResult.error || placementsResult.error),
  };
}

async function paymentSummaryByContract(contractIds: string[]): Promise<Map<string, ContractFinancialSummary>> {
  if (contractIds.length === 0) return new Map();
  const supabase = await createClient();
  const { data } = await supabase
    .from('contract_payments')
    .select('id, contract_id, legacy_contract_id, installment_number, description, amount, paid_amount, due_date, paid_at, payment_method, status, transaction_reference, receipt_url, notes, created_at, updated_at')
    .in('contract_id', contractIds);

  const grouped = new Map<string, PaymentRow[]>();
  for (const payment of data ?? []) {
    const list = grouped.get(payment.contract_id) ?? [];
    list.push(payment);
    grouped.set(payment.contract_id, list);
  }
  return new Map(contractIds.map((id) => [id, summarizePayments(grouped.get(id) ?? [])]));
}

export async function listCommercialContracts(filters: ContractListFilters = {}): Promise<PagedContracts> {
  const supabase = await createClient();
  const page = Math.max(1, filters.page ?? 1);
  const from = (page - 1) * COMMERCIAL_PAGE_SIZE;
  const to = from + COMMERCIAL_PAGE_SIZE - 1;
  let query = supabase
    .from('ad_contracts')
    .select('id, contract_number, title, client_id, advertiser_id, start_date, end_date, status, total_amount, negotiated_value', { count: 'exact' })
    .order('end_date', { ascending: true })
    .range(from, to);

  if (filters.clientId) query = query.eq('client_id', filters.clientId);
  if (filters.startDate) query = query.gte('start_date', filters.startDate);
  if (filters.endDate) query = query.lte('start_date', filters.endDate);
  if (filters.status && filters.status !== 'todos' && filters.status !== 'vencendo') {
    query = query.eq('status', filters.status as AdContractStatus);
  }
  if (filters.status === 'vencendo') {
    const today = todayInBahia();
    const soon = new Date(`${today}T12:00:00-03:00`);
    soon.setDate(soon.getDate() + 30);
    const last = soon.toLocaleDateString('en-CA', { timeZone: 'America/Bahia' });
    query = query.in('status', ['ativo', 'agendado']).gte('end_date', today).lte('end_date', last);
  }
  if (filters.query?.trim()) query = query.ilike('title', `%${filters.query.trim().replace(/[%_]/g, '')}%`);

  const contractsResult = await query;
  const contracts = contractsResult.data ?? [];
  const ids = contracts.map((contract) => contract.id);
  const [summaries, clientsResult, brandsResult] = await Promise.all([
    paymentSummaryByContract(ids),
    ids.length
      ? supabase.from('commercial_clients').select('id, client_name, trade_name, company_name').in('id', contracts.flatMap((contract) => contract.client_id ? [contract.client_id] : []))
      : Promise.resolve({ data: [], error: null }),
    ids.length
      ? supabase.from('commercial_brands').select('id, name').in('id', contracts.flatMap((contract) => contract.advertiser_id ? [contract.advertiser_id] : []))
      : Promise.resolve({ data: [], error: null }),
  ]);
  const clientMap = new Map((clientsResult.data ?? []).map((client) => [client.id, client]));
  const brandMap = new Map((brandsResult.data ?? []).map((brand) => [brand.id, brand]));

  const rows = contracts.map((contract) => {
    const summary = summaries.get(contract.id) ?? {
      totalAmount: 0, paidAmount: 0, pendingAmount: 0, overdueAmount: 0, cancelledAmount: 0, refundedAmount: 0, nextDueDate: null,
    };
    const client = contract.client_id ? clientMap.get(contract.client_id) : null;
    return {
      id: contract.id,
      contract_number: contract.contract_number,
      title: contract.title,
      client_name: client?.trade_name ?? client?.company_name ?? client?.client_name ?? 'Cliente não identificado',
      advertiser_name: contract.advertiser_id ? brandMap.get(contract.advertiser_id)?.name ?? null : null,
      start_date: contract.start_date,
      end_date: contract.end_date,
      status: contract.status,
      total_amount: toNumber(contract.total_amount || contract.negotiated_value),
      paid_amount: summary.paidAmount,
      pending_amount: summary.pendingAmount,
      overdue_amount: summary.overdueAmount,
      next_due_date: summary.nextDueDate,
    } satisfies ContractListRow;
  }).filter((row) => financialStatusMatches({
    totalAmount: row.total_amount,
    paidAmount: row.paid_amount,
    pendingAmount: row.pending_amount,
    overdueAmount: row.overdue_amount,
    cancelledAmount: 0,
    refundedAmount: 0,
    nextDueDate: row.next_due_date,
  }, filters.financialStatus));

  const total = contractsResult.count ?? 0;
  return {
    rows,
    page,
    pageCount: Math.max(1, Math.ceil(total / COMMERCIAL_PAGE_SIZE)),
    total,
    hasError: Boolean(contractsResult.error || clientsResult.error || brandsResult.error),
  };
}

export async function getCommercialContractDetail(id: string): Promise<ContractDetail | null> {
  const supabase = await createClient();
  const contractResult = await supabase.from('ad_contracts').select('*').eq('id', id).maybeSingle();
  const contract = contractResult.data;
  if (!contract) return null;

  const [clientResult, brandResult, itemsResult, campaignsResult, paymentsResult, filesResult, historyResult] = await Promise.all([
    contract.client_id
      ? supabase.from('commercial_clients').select('*').eq('id', contract.client_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    contract.advertiser_id
      ? supabase.from('commercial_brands').select('*').eq('id', contract.advertiser_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase.from('contract_items').select('*').eq('contract_id', id).order('created_at'),
    supabase.from('ad_campaigns').select('*').eq('contract_id', id).order('start_at'),
    supabase.from('contract_payments').select('*').eq('contract_id', id).order('installment_number'),
    supabase.from('contract_files').select('*').eq('contract_id', id).order('created_at', { ascending: false }),
    supabase.from('contract_history').select('*').eq('contract_id', id).order('created_at', { ascending: false }),
  ]);
  const rawFiles = filesResult.data ?? [];
  const files = await Promise.all(rawFiles.map(async (file): Promise<CommercialContractFile> => {
    if (/^https?:\/\//i.test(file.file_url)) return { ...file, downloadUrl: file.file_url };
    const { data: signed } = await supabase.storage.from('commercial-files').createSignedUrl(file.file_url, 60 * 60);
    return { ...file, downloadUrl: signed?.signedUrl ?? null };
  }));
  const payments = paymentsResult.data ?? [];
  const summary = summarizePayments(payments);
  return {
    contract,
    client: clientResult.data,
    brand: brandResult.data,
    items: itemsResult.data ?? [],
    campaigns: campaignsResult.data ?? [],
    payments,
    files,
    history: historyResult.data ?? [],
    financial: { ...summary, totalAmount: toNumber(contract.total_amount || contract.negotiated_value) },
  };
}

export async function listCommercialCampaigns(filters: CampaignListFilters = {}): Promise<PagedCampaigns> {
  const supabase = await createClient();
  const page = Math.max(1, filters.page ?? 1);
  const from = (page - 1) * COMMERCIAL_PAGE_SIZE;
  const to = from + COMMERCIAL_PAGE_SIZE - 1;
  let query = supabase
    .from('ad_campaigns')
    .select('*', { count: 'exact' })
    .order('end_at', { ascending: true })
    .range(from, to);
  if (filters.status && filters.status !== 'todos') query = query.eq('status', filters.status as CampaignStatus);
  if (filters.placement && filters.placement !== 'todos') query = query.eq('placement', filters.placement as Tables<'ad_campaigns'>['placement']);
  const campaignsResult = await query;
  const campaigns = campaignsResult.data ?? [];
  const contractIds = [...new Set(campaigns.map((campaign) => campaign.contract_id))];
  const contractsResult = contractIds.length
    ? await supabase.from('ad_contracts').select('id, contract_number, title, client_id').in('id', contractIds)
    : { data: [], error: null };
  const clientsResult = (contractsResult.data ?? []).length
    ? await supabase.from('commercial_clients').select('id, client_name, trade_name, company_name').in('id', (contractsResult.data ?? []).flatMap((contract) => contract.client_id ? [contract.client_id] : []))
    : { data: [], error: null };
  const contractMap = new Map((contractsResult.data ?? []).map((contract) => [contract.id, contract]));
  const clientMap = new Map((clientsResult.data ?? []).map((client) => [client.id, client]));
  const rows = campaigns.map((campaign) => {
    const contract = contractMap.get(campaign.contract_id);
    const client = contract?.client_id ? clientMap.get(contract.client_id) : null;
    return {
      ...campaign,
      contract_number: contract?.contract_number ?? null,
      contract_title: contract?.title ?? 'Contrato não encontrado',
      client_name: client?.trade_name ?? client?.company_name ?? client?.client_name ?? '—',
    } satisfies CampaignListRow;
  });
  const total = campaignsResult.count ?? 0;
  return {
    rows,
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / COMMERCIAL_PAGE_SIZE)),
    hasError: Boolean(campaignsResult.error || contractsResult.error || clientsResult.error),
  };
}

export async function getFinancialContractRows(filters: ContractListFilters = {}): Promise<PagedContracts> {
  return listCommercialContracts(filters);
}

export interface FinancialReportSummary {
  grossContracted: number;
  discounts: number;
  additionalCosts: number;
  netContracted: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  cancelledAmount: number;
  refundedAmount: number;
  averageContractValue: number;
  contractsCount: number;
  paymentsCount: number;
}

export async function getFinancialReportSummary(input: {
  startDate?: string;
  endDate?: string;
  clientId?: string;
} = {}): Promise<{ summary: FinancialReportSummary; hasError: boolean }> {
  const supabase = await createClient();
  let contractsQuery = supabase
    .from('ad_contracts')
    .select('id, client_id, subtotal, contract_discount_type, contract_discount_value, additional_costs, total_amount, negotiated_value, start_date, end_date')
    .order('start_date', { ascending: false });
  if (input.clientId) contractsQuery = contractsQuery.eq('client_id', input.clientId);
  if (input.startDate) contractsQuery = contractsQuery.gte('start_date', input.startDate);
  if (input.endDate) contractsQuery = contractsQuery.lte('start_date', input.endDate);
  const contractsResult = await contractsQuery;
  const contracts = contractsResult.data ?? [];
  const ids = contracts.map((contract) => contract.id);
  let paymentsResult: { data: PaymentRow[] | null; error: { message: string } | null } = { data: [], error: null };
  if (ids.length > 0) {
    let paymentsQuery = supabase
      .from('contract_payments')
      .select('*')
      .in('contract_id', ids);
    if (input.startDate) paymentsQuery = paymentsQuery.gte('due_date', input.startDate);
    if (input.endDate) paymentsQuery = paymentsQuery.lte('due_date', input.endDate);
    paymentsResult = await paymentsQuery;
  }
  const paymentSummary = summarizePayments(paymentsResult.data ?? []);
  const grossContracted = contracts.reduce((sum, contract) => sum + toNumber(contract.subtotal || contract.negotiated_value), 0);
  const discounts = contracts.reduce((sum, contract) => {
    const value = toNumber(contract.contract_discount_value);
    if (contract.contract_discount_type === 'percentual') return sum + Math.round(toNumber(contract.subtotal) * value) / 100;
    return sum + value;
  }, 0);
  const additionalCosts = contracts.reduce((sum, contract) => sum + toNumber(contract.additional_costs), 0);
  const netContracted = contracts.reduce((sum, contract) => sum + toNumber(contract.total_amount || contract.negotiated_value), 0);
  return {
    summary: {
      grossContracted,
      discounts,
      additionalCosts,
      netContracted,
      paidAmount: paymentSummary.paidAmount,
      pendingAmount: paymentSummary.pendingAmount,
      overdueAmount: paymentSummary.overdueAmount,
      cancelledAmount: paymentSummary.cancelledAmount,
      refundedAmount: paymentSummary.refundedAmount,
      averageContractValue: contracts.length ? netContracted / contracts.length : 0,
      contractsCount: contracts.length,
      paymentsCount: (paymentsResult.data ?? []).length,
    },
    hasError: Boolean(contractsResult.error || paymentsResult.error),
  };
}
