import CampaignManager from '@/features/commercial/CampaignManager';
import { getCommercialReferences, listCommercialCampaigns } from '@/features/commercial/queries';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ status?: string; placement?: string; pagina?: string }>;
}

export default async function CommercialCampaignsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.pagina);
  const filters = {
    status: params.status || undefined,
    placement: params.placement || undefined,
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
  };
  const [result, references] = await Promise.all([listCommercialCampaigns(filters), getCommercialReferences()]);
  return <CampaignManager result={result} filters={filters} placements={references.placements} />;
}
