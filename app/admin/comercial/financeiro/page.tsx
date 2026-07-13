import FinancialReport from '@/features/commercial/FinancialReport';
import {
  getCommercialReferences,
  getFinancialContractRows,
  getFinancialReportSummary,
} from '@/features/commercial/queries';

export const dynamic = 'force-dynamic';

function dateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Bahia', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date).reduce<Record<string, string>>((result, part) => {
    result[part.type] = part.value;
    return result;
  }, {});
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function periodRange(period: string, customStart?: string, customEnd?: string): { startDate: string; endDate: string } {
  const now = new Date();
  const today = dateKey(now);
  const [year, month] = today.split('-').map(Number);
  const currentYear = year ?? now.getUTCFullYear();
  const currentMonth = month ?? now.getUTCMonth() + 1;
  if (period === 'personalizado' && /^\d{4}-\d{2}-\d{2}$/.test(customStart ?? '') && /^\d{4}-\d{2}-\d{2}$/.test(customEnd ?? '')) {
    return { startDate: customStart!, endDate: customEnd! };
  }
  if (period === 'mes_anterior') {
    const start = new Date(Date.UTC(currentYear, currentMonth - 2, 1));
    const end = new Date(Date.UTC(currentYear, currentMonth - 1, 0));
    return { startDate: dateKey(start), endDate: dateKey(end) };
  }
  if (period === 'ultimos_30') return { startDate: dateKey(addDays(now, -29)), endDate: today };
  if (period === 'trimestre') {
    const quarterStartMonth = Math.floor((currentMonth - 1) / 3) * 3;
    const start = new Date(Date.UTC(currentYear, quarterStartMonth, 1));
    const end = new Date(Date.UTC(currentYear, quarterStartMonth + 3, 0));
    return { startDate: dateKey(start), endDate: dateKey(end) };
  }
  if (period === 'ano_atual') return { startDate: `${currentYear}-01-01`, endDate: `${currentYear}-12-31` };
  const start = new Date(Date.UTC(currentYear, currentMonth - 1, 1));
  const end = new Date(Date.UTC(currentYear, currentMonth, 0));
  return { startDate: dateKey(start), endDate: dateKey(end) };
}

interface Props {
  searchParams: Promise<{ periodo?: string; de?: string; ate?: string; cliente?: string; financeiro?: string; pagina?: string }>;
}

export default async function CommercialFinancialPage({ searchParams }: Props) {
  const params = await searchParams;
  const period = params.periodo ?? 'mes_atual';
  const { startDate, endDate } = periodRange(period, params.de, params.ate);
  const page = Number(params.pagina);
  const contractFilters = {
    startDate,
    endDate,
    clientId: params.cliente || undefined,
    financialStatus: params.financeiro || undefined,
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
  };
  const [references, summaryResult, contracts] = await Promise.all([
    getCommercialReferences(),
    getFinancialReportSummary({ startDate, endDate, clientId: contractFilters.clientId }),
    getFinancialContractRows(contractFilters),
  ]);
  return <FinancialReport summary={summaryResult.summary} contracts={contracts} clients={references.clients} hasError={references.hasError || summaryResult.hasError || contracts.hasError} filters={{ period, startDate, endDate, clientId: contractFilters.clientId, financialStatus: contractFilters.financialStatus }} />;
}
