import ContractForm from '@/features/admin/ContractForm';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function NovoContratoPage() {
  const supabase = await createClient();
  const { data: clients } = await supabase
    .from('commercial_clients')
    .select('id, client_name')
    .order('client_name');

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold text-title">Novo contrato</h2>
      <ContractForm clients={clients ?? []} />
    </div>
  );
}
