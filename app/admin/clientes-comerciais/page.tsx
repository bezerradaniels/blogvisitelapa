import ClientManager from '@/features/admin/ClientManager';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminClientesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('commercial_clients')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold text-title">Clientes comerciais</h2>
      <ClientManager clients={data ?? []} />
    </div>
  );
}
