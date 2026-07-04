import EmptyState from '@/components/EmptyState';
import UserRowControl from '@/features/admin/UserRowControl';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils/format';

export const dynamic = 'force-dynamic';

export default async function AdminUsuariosPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, slug, role, status, created_at')
    .order('created_at', { ascending: false })
    .limit(500);
  const users = data ?? [];

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold text-title">Usuários</h2>
      <p className="text-xs text-muted">
        Defina o papel (Usuário → Publisher → Admin) e o status de cada conta. Publishers ativos
        publicam direto.
      </p>

      {users.length === 0 ? (
        <EmptyState title="Nenhum usuário cadastrado" />
      ) : (
        <div className="card-base overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left text-xs text-muted">
              <tr>
                <th className="p-3">Nome</th>
                <th className="p-3">Desde</th>
                <th className="p-3">Papel / Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="p-3 font-medium text-title">{u.full_name ?? '—'}</td>
                  <td className="p-3 text-muted">{formatDate(u.created_at)}</td>
                  <td className="p-3">
                    <UserRowControl profileId={u.id} role={u.role} status={u.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
