import Link from 'next/link';
import AdminPageHeader from '@/components/AdminPageHeader';
import AdminStatusNav from '@/components/AdminStatusNav';
import CommentRowActions from '@/features/admin/CommentRowActions';
import { countAdminComments, listAdminComments } from '@/features/admin/queries';
import { formatDateTime, titleCase } from '@/lib/utils/format';

export const dynamic = 'force-dynamic';

const tabs = [
  { label: 'Todos', value: 'todos' },
  { label: 'Pendentes', value: 'pendentes' },
  { label: 'Aprovados', value: 'aprovado' },
  { label: 'Rejeitados', value: 'rejeitado' },
  { label: 'Lixeira', value: 'removido' },
];

interface Props { searchParams: Promise<{ filtro?: string; q?: string; pagina?: string }> }

export default async function AdminCommentsPage({ searchParams }: Props) {
  const params = await searchParams;
  const filtro = params.filtro ?? 'pendentes';
  const q = params.q ?? '';
  const requestedPage = Math.max(1, Number.parseInt(params.pagina ?? '1', 10) || 1);
  const [{ comments, count, page, pageSize }, counts] = await Promise.all([listAdminComments(filtro, q, requestedPage), countAdminComments()]);
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const href = (target: number) => { const query = new URLSearchParams(); if (filtro !== 'todos') query.set('filtro', filtro); if (q) query.set('q', q); if (target > 1) query.set('pagina', String(target)); return `/admin/comentarios?${query}`; };

  return (
    <div className="admin-page space-y-4">
      <AdminPageHeader title="Comentários" description="Todos os comentários exigem aprovação antes de aparecer no site." />
      <AdminStatusNav items={tabs.map((tab) => ({ ...tab, count: counts[tab.value] ?? 0 }))} current={filtro} basePath="/admin/comentarios" />
      <form action="/admin/comentarios" className="flex justify-end gap-1.5">
        {filtro !== 'todos' && <input type="hidden" name="filtro" value={filtro} />}
        <label><span className="sr-only">Pesquisar comentários</span><input className="admin-control w-64 max-w-full" type="search" name="q" defaultValue={q} placeholder="Pesquisar comentários…" /></label>
        <button className="admin-button" type="submit">Pesquisar comentários</button>
      </form>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Autor</th><th>Comentário</th><th className="admin-column-category">Em resposta a</th><th className="admin-column-date">Data</th></tr></thead>
          <tbody>
            {comments.length === 0 && <tr><td colSpan={4}>Nenhum comentário nesta visualização.</td></tr>}
            {comments.map((comment) => <tr key={comment.id}>
              <td className="font-medium">{titleCase(comment.author?.full_name) || 'Leitor'}</td>
              <td className="admin-title-column"><p>{comment.content}</p><CommentRowActions commentId={comment.id} status={comment.status} /></td>
              <td className="admin-column-category">{comment.post ? <Link href={`/post/${comment.post.slug}`} className="admin-link">{comment.post.title}</Link> : '—'}</td>
              <td className="admin-column-date">{formatDateTime(comment.created_at)}</td>
            </tr>)}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between text-xs text-[#646970]"><span>{count} {count === 1 ? 'item' : 'itens'}</span>{totalPages > 1 && <nav className="admin-pagination" aria-label="Paginação de comentários">{page > 1 ? <Link href={href(page - 1)}>‹</Link> : <span>‹</span>}<span aria-current="page">{page} de {totalPages}</span>{page < totalPages ? <Link href={href(page + 1)}>›</Link> : <span>›</span>}</nav>}</div>
    </div>
  );
}
