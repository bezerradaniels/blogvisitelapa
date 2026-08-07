import Link from 'next/link';
import PostManagementTable from '@/features/admin/PostManagementTable';
import { countAdminPosts, listAdminPosts, listPostAuthors, listPostCategories } from '@/features/admin/queries';

export const dynamic = 'force-dynamic';

const tabs = [
  { label: 'Todos', value: 'todos' },
  { label: 'Aguardando revisão', value: 'pendentes' },
  { label: 'A aprovar', value: 'aprovacao' },
  { label: 'Publicados', value: 'publicados' },
  { label: 'Rascunhos', value: 'rascunhos' },
  { label: 'Arquivados', value: 'arquivados' },
  { label: 'Removidos', value: 'removidos' },
];

interface Props {
  searchParams: Promise<{ filtro?: string; q?: string; autor?: string; categoria?: string; mes?: string; pagina?: string }>;
}

function pageHref(params: Record<string, string>, page: number) {
  const query = new URLSearchParams(params);
  if (page > 1) query.set('pagina', String(page));
  else query.delete('pagina');
  return `/admin/posts?${query.toString()}`;
}

function monthOptions() {
  const formatter = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  return Array.from({ length: 18 }, (_, index) => {
    const date = new Date();
    date.setUTCDate(1);
    date.setUTCMonth(date.getUTCMonth() - index);
    return { value: `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`, label: formatter.format(date) };
  });
}

export default async function AdminPostsPage({ searchParams }: Props) {
  const params = await searchParams;
  const filtro = params.filtro ?? 'todos';
  const q = params.q ?? '';
  const authorId = params.autor ?? '';
  const categoryId = params.categoria ?? '';
  const month = params.mes ?? '';
  const requestedPage = Math.max(1, Number.parseInt(params.pagina ?? '1', 10) || 1);
  const [{ posts, count, page, pageSize }, authors, categories, counts] = await Promise.all([
    listAdminPosts({ filter: filtro, term: q, authorId, categoryId, month, page: requestedPage, isEvent: false }),
    listPostAuthors(),
    listPostCategories(),
    countAdminPosts(false),
  ]);
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const currentParams = Object.fromEntries(Object.entries({ filtro, q, autor: authorId, categoria: categoryId, mes: month }).filter(([, value]) => value));

  return (
    <div className="admin-page space-y-4">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="admin-page-title">Artigos</h1>
          <Link href="/admin/posts/novo" className="admin-button admin-button-primary">Adicionar artigo</Link>
        </div>
        <ul className="admin-status-links mt-3 text-[13px]" aria-label="Filtrar posts por status">
          {tabs.map((tab) => {
            const query = new URLSearchParams();
            if (tab.value !== 'todos') query.set('filtro', tab.value);
            const href = query.size ? `/admin/posts?${query}` : '/admin/posts';
            return <li key={tab.value}><Link href={href} aria-current={tab.value === filtro ? 'page' : undefined}>{tab.label} <span className="text-[#646970]">({counts[tab.value] ?? 0})</span></Link></li>;
          })}
        </ul>
      </header>

      <div className="flex flex-col-reverse gap-2 lg:flex-row lg:items-end lg:justify-between">
        <form action="/admin/posts" className="flex flex-wrap items-end gap-1.5">
          {filtro !== 'todos' && <input type="hidden" name="filtro" value={filtro} />}
          {q && <input type="hidden" name="q" value={q} />}
          <label className="grid gap-1 text-xs text-[#50575e]">
            <span className="sr-only">Filtrar por data</span>
            <select name="mes" defaultValue={month} className="admin-control w-auto">
              <option value="">Todas as datas</option>
              {monthOptions().map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-xs text-[#50575e]">
            <span className="sr-only">Filtrar por categoria</span>
            <select name="categoria" defaultValue={categoryId} className="admin-control w-auto max-w-52">
              <option value="">Todas as categorias</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-xs text-[#50575e]">
            <span className="sr-only">Filtrar por autor</span>
            <select name="autor" defaultValue={authorId} className="admin-control w-auto max-w-52">
              <option value="">Todos os autores</option>
              {authors.map((author) => <option key={author.id} value={author.id}>{author.full_name ?? 'Sem nome'}</option>)}
            </select>
          </label>
          <button type="submit" className="admin-button">Filtrar</button>
        </form>

        <form action="/admin/posts" className="flex items-end gap-1.5 lg:justify-end">
          {filtro !== 'todos' && <input type="hidden" name="filtro" value={filtro} />}
          {authorId && <input type="hidden" name="autor" value={authorId} />}
          {categoryId && <input type="hidden" name="categoria" value={categoryId} />}
          {month && <input type="hidden" name="mes" value={month} />}
          <label className="flex-1 lg:flex-none">
            <span className="sr-only">Buscar artigos</span>
            <input type="search" name="q" defaultValue={q} placeholder="Pesquisar artigos…" className="admin-control w-full min-w-0 sm:w-64" />
          </label>
          <button type="submit" className="admin-button">Pesquisar artigos</button>
        </form>
      </div>

      {posts.length === 0 ? (
        <div className="border border-[#c3c4c7] bg-white px-4 py-8 text-center text-sm text-[#50575e]">Nenhum artigo encontrado.</div>
      ) : (
        <PostManagementTable posts={posts} authors={authors} />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#646970]">
        <span>{count} {count === 1 ? 'item' : 'itens'}</span>
        {totalPages > 1 && (
          <nav className="admin-pagination" aria-label="Paginação de posts">
            {page > 1 ? <Link href={pageHref(currentParams, 1)} aria-label="Primeira página">«</Link> : <span aria-hidden>«</span>}
            {page > 1 ? <Link href={pageHref(currentParams, page - 1)} aria-label="Página anterior">‹</Link> : <span aria-hidden>‹</span>}
            <span aria-current="page">{page} de {totalPages}</span>
            {page < totalPages ? <Link href={pageHref(currentParams, page + 1)} aria-label="Próxima página">›</Link> : <span aria-hidden>›</span>}
            {page < totalPages ? <Link href={pageHref(currentParams, totalPages)} aria-label="Última página">»</Link> : <span aria-hidden>»</span>}
          </nav>
        )}
      </div>
    </div>
  );
}
