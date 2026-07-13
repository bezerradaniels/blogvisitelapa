import ContractWizard from '@/features/commercial/ContractWizard';
import { getCommercialReferences } from '@/features/commercial/queries';

export const dynamic = 'force-dynamic';

export default async function NewCommercialContractPage() {
  const references = await getCommercialReferences();
  return (
    <ContractWizard
      clients={references.clients}
      brands={references.brands}
      products={references.products}
      placements={references.placements}
    />
  );
}
