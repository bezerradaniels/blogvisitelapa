import Link from 'next/link';
import AdminPageHeader from '@/components/AdminPageHeader';
import PostManagementTable from '@/features/admin/PostManagementTable';
import { listAdminPosts, listPostAuthors } from '@/features/admin/queries';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ q?: string; pagina?: string }>;
}

function pageHref(term: string, page: number) {
  const query = new URLSearchParams();
  if (term) query.set('q', term);
  if (page > 1) query.set('pagina', String(page));
  return `/admin/eventos?${query.toString()}`;
}

export default async function AdminEventosPage({ searchParams }: Props) {
  const params = await searchParams;
  const term = params.q ?? '';
  const requestedPage = Math.max(1, Number.parseInt(params.pagina ?? '1', 10) || 1);
  const [{ posts, count, page, pageSize }, authors] = await Promise.all([
    listAdminPosts({ term, page: requestedPage, pageSize: 25, isEvent: true }),
    listPostAuthors(),
  ]);
  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  return (
    <div className="admin-page space-y-4">
      <AdminPageHeader title="Eventos" actionHref="/admin/eventos/novo" actionLabel="Adicionar evento" description="Gerencie os eventos publicados, em revisão e em rascunho." />

      <form action="/admin/eventos" className="flex items-end gap-1.5 lg:justify-end">
        <label className="flex-1 lg:flex-none">
          <span className="sr-only">Buscar eventos</span>
          <input type="search" name="q" defaultValue={term} placeholder="Pesquisar eventos…" className="admin-control w-full min-w-0 sm:w-64" />
        </label>
        <button type="submit" className="admin-button">Pesquisar eventos</button>
      </form>

      {posts.length === 0 ? (
        <div className="border border-[#c3c4c7] bg-white px-4 py-8 text-center text-sm text-[#50575e]">Nenhum evento encontrado.</div>
      ) : (
        <PostManagementTable posts={posts} authors={authors} />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#646970]">
        <span>{count} {count === 1 ? 'evento' : 'eventos'}</span>
        {totalPages > 1 && (
          <nav className="admin-pagination" aria-label="Paginação de eventos">
            {page > 1 ? <Link href={pageHref(term, 1)} aria-label="Primeira página">«</Link> : <span aria-hidden>«</span>}
            {page > 1 ? <Link href={pageHref(term, page - 1)} aria-label="Página anterior">‹</Link> : <span aria-hidden>‹</span>}
            <span aria-current="page">{page} de {totalPages}</span>
            {page < totalPages ? <Link href={pageHref(term, page + 1)} aria-label="Próxima página">›</Link> : <span aria-hidden>›</span>}
            {page < totalPages ? <Link href={pageHref(term, totalPages)} aria-label="Última página">»</Link> : <span aria-hidden>»</span>}
          </nav>
        )}
      </div>
    </div>
  );
}
