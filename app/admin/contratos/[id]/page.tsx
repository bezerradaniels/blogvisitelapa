import { notFound } from 'next/navigation';
import ContractForm from '@/features/admin/ContractForm';
import type { ContractInput } from '@/features/admin/adActions';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditarContratoPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: contract }, { data: clients }] = await Promise.all([
    supabase.from('ad_contracts').select('*').eq('id', id).maybeSingle(),
    supabase.from('commercial_clients').select('id, client_name').order('client_name'),
  ]);
  if (!contract) notFound();

  const initial: ContractInput = {
    id: contract.id,
    title: contract.title,
    contract_type: contract.contract_type ?? '',
    ad_type: contract.ad_type ?? '',
    client_id: contract.client_id ?? '',
    company_name: contract.company_name ?? '',
    start_date: contract.start_date,
    end_date: contract.end_date,
    negotiated_value: contract.negotiated_value != null ? String(contract.negotiated_value) : '',
    payment_method: contract.payment_method ?? '',
    payment_status: contract.payment_status,
    payment_notes: contract.payment_notes ?? '',
    internal_notes: contract.internal_notes ?? '',
    placement: contract.placement,
    banner_url: contract.banner_url ?? '',
    link_url: contract.link_url ?? '',
    priority: String(contract.priority),
    renewal_enabled: contract.renewal_enabled,
    status: contract.status,
  };

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold text-title">Editar contrato</h2>
      <ContractForm clients={clients ?? []} initial={initial} />
    </div>
  );
}
