import ClientManager from '@/features/admin/ClientManager';
import { adminGuard } from '@/lib/auth/adminGuard';

export const dynamic = 'force-dynamic';

export default async function ComercialClientesPage() {
  const ctx = await adminGuard();
  if (!ctx) return null;

  const { data, error } = await ctx.supabase
    .from('commercial_clients')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error('Não foi possível carregar os clientes comerciais.');

  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-headline text-2xl font-extrabold text-title">Clientes</h1>
        <p className="mt-1 text-sm text-muted">
          Cadastro central para relacionamento, contratação e cobrança comercial.
        </p>
      </header>
      <ClientManager clients={data ?? []} />
    </div>
  );
}
