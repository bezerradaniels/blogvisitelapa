import ContractList from '@/features/commercial/ContractList';
import { getCommercialReferences, listCommercialContracts } from '@/features/commercial/queries';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{
    q?: string;
    status?: string;
    cliente?: string;
    financeiro?: string;
    pagina?: string;
  }>;
}

export default async function CommercialContractsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.pagina);
  const filters = {
    query: params.q?.trim() || undefined,
    status: params.status || undefined,
    clientId: params.cliente || undefined,
    financialStatus: params.financeiro || undefined,
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
  };
  const [result, references] = await Promise.all([
    listCommercialContracts(filters),
    getCommercialReferences(),
  ]);

  return <ContractList result={result} filters={filters} clients={references.clients} />;
}
