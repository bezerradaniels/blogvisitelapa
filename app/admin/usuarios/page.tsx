import Link from 'next/link';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import EmptyState from '@/components/EmptyState';
import UserRowControl from '@/features/admin/UserRowControl';
import { getCurrentUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils/format';

export const dynamic = 'force-dynamic';

export default async function AdminUsuariosPage() {
  const [current, supabase] = await Promise.all([getCurrentUser(), createClient()]);
  const [{ data }, { data: attentionRows }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, slug, role, status, created_at')
      .order('created_at', { ascending: false })
      .limit(500),
    supabase
      .from('audit_logs')
      .select('entity_id, action, created_at')
      .eq('entity', 'profiles')
      .in('action', ['user.attention_flagged', 'user.attention_cleared'])
      .order('created_at', { ascending: false }),
  ]);
  const users = data ?? [];
  const latestAttention = new Map<string, string>();
  for (const row of attentionRows ?? []) {
    if (row.entity_id && !latestAttention.has(row.entity_id)) {
      latestAttention.set(row.entity_id, row.action);
    }
  }
  const attentionIds = new Set(
    [...latestAttention.entries()]
      .filter(([, action]) => action === 'user.attention_flagged')
      .map(([profileId]) => profileId),
  );

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
                <th className="p-3 text-right">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="p-3 font-medium text-title">
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/usuarios/${u.id}`} className="hover:text-brand hover:underline">
                        {u.full_name ?? '—'}
                      </Link>
                      {attentionIds.has(u.id) && <Badge tone="warning">Atenção</Badge>}
                    </div>
                  </td>
                  <td className="p-3 text-muted">{formatDate(u.created_at)}</td>
                  <td className="p-3">
                    <UserRowControl
                      profileId={u.id}
                      role={u.role}
                      status={u.status}
                      isSelf={u.id === current?.profile?.id}
                    />
                  </td>
                  <td className="p-3 text-right">
                    <Button href={`/admin/usuarios/${u.id}`} size="sm" variant="outline">
                      Ver detalhes
                    </Button>
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
