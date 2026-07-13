import { notFound } from 'next/navigation';
import ContractDetail from '@/features/commercial/ContractDetail';
import { getCommercialContractDetail } from '@/features/commercial/queries';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CommercialContractDetailPage({ params }: Props) {
  const { id } = await params;
  const data = await getCommercialContractDetail(id);
  if (!data) notFound();
  return <ContractDetail data={data} />;
}
