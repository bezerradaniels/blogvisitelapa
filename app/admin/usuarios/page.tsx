import Link from 'next/link';
import AdminPageHeader from '@/components/AdminPageHeader';
import Badge from '@/components/Badge';
import UserRowControl from '@/features/admin/UserRowControl';
import { getCurrentUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { formatDate, titleCase } from '@/lib/utils/format';

export const dynamic = 'force-dynamic';

interface Props { searchParams: Promise<{ q?: string; papel?: string; status?: string; pagina?: string }> }

export default async function AdminUsuariosPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = params.q?.trim() ?? '';
  const role = params.papel ?? '';
  const status = params.status ?? '';
  const page = Math.max(1, Number.parseInt(params.pagina ?? '1', 10) || 1);
  const pageSize = 25;
  const [current, supabase] = await Promise.all([getCurrentUser(), createClient()]);
  let usersQuery = supabase.from('profiles').select('id, full_name, slug, role, status, created_at', { count: 'exact' }).order('created_at', { ascending: false });
  if (q) usersQuery = usersQuery.ilike('full_name', `%${q}%`);
  if (role) usersQuery = usersQuery.eq('role', role as 'admin');
  if (status) usersQuery = usersQuery.eq('status', status as 'active');
  const from = (page - 1) * pageSize;
  const [{ data, count }, { data: attentionRows }] = await Promise.all([
    usersQuery.range(from, from + pageSize - 1),
    supabase.from('audit_logs').select('entity_id, action, created_at').eq('entity', 'profiles').in('action', ['user.attention_flagged', 'user.attention_cleared']).order('created_at', { ascending: false }),
  ]);
  const users = data ?? [];
  const latestAttention = new Map<string, string>();
  for (const row of attentionRows ?? []) if (row.entity_id && !latestAttention.has(row.entity_id)) latestAttention.set(row.entity_id, row.action);
  const attentionIds = new Set([...latestAttention.entries()].filter(([, action]) => action === 'user.attention_flagged').map(([profileId]) => profileId));
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const href = (target: number) => { const query = new URLSearchParams(); if (q) query.set('q', q); if (role) query.set('papel', role); if (status) query.set('status', status); if (target > 1) query.set('pagina', String(target)); return `/admin/usuarios?${query}`; };

  return (
    <div className="admin-page space-y-4">
      <AdminPageHeader title="Usuários" description="Gerencie papéis, estado da conta e acesso às áreas editoriais." />
      <form action="/admin/usuarios" className="flex flex-wrap items-end gap-1.5">
        <label><span className="sr-only">Pesquisar usuários</span><input className="admin-control w-64 max-w-full" type="search" name="q" defaultValue={q} placeholder="Pesquisar usuários…" /></label>
        <label><span className="sr-only">Filtrar por papel</span><select className="admin-control" name="papel" defaultValue={role}><option value="">Todos os papéis</option><option value="admin">Administrador</option><option value="publisher">Editor</option><option value="common_user">Usuário</option></select></label>
        <label><span className="sr-only">Filtrar por status</span><select className="admin-control" name="status" defaultValue={status}><option value="">Todos os status</option><option value="active">Ativo</option><option value="pending">Pendente</option><option value="suspended">Suspenso</option><option value="deactivated">Desativado</option><option value="pending_deletion">Exclusão pendente</option></select></label>
        <button className="admin-button" type="submit">Filtrar</button>
      </form>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Usuário</th><th className="admin-column-date">Cadastro</th><th>Papel e status</th></tr></thead>
          <tbody>
            {users.length === 0 && <tr><td colSpan={3}>Nenhum usuário encontrado.</td></tr>}
            {users.map((user) => <tr key={user.id}>
              <td className="admin-title-column"><div className="flex items-center gap-2"><Link href={`/admin/usuarios/${user.id}`} className="admin-title-link">{titleCase(user.full_name) || 'Sem nome'}</Link>{attentionIds.has(user.id) && <Badge tone="warning">Atenção</Badge>}</div><div className="admin-row-actions !visible"><Link className="admin-row-action" href={`/admin/usuarios/${user.id}`}>Editar</Link>{user.slug && <Link className="admin-row-action" href={`/u/${user.slug}`}>Visualizar</Link>}</div></td>
              <td className="admin-column-date">{formatDate(user.created_at)}</td>
              <td><UserRowControl profileId={user.id} role={user.role} status={user.status} isSelf={user.id === current?.profile?.id} /></td>
            </tr>)}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between text-xs text-[#646970]"><span>{total} {total === 1 ? 'usuário' : 'usuários'}</span>{totalPages > 1 && <nav className="admin-pagination" aria-label="Paginação de usuários">{page > 1 ? <Link href={href(page - 1)}>‹</Link> : <span>‹</span>}<span aria-current="page">{page} de {totalPages}</span>{page < totalPages ? <Link href={href(page + 1)}>›</Link> : <span>›</span>}</nav>}</div>
    </div>
  );
}
