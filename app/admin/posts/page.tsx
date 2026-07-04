import Link from 'next/link';
import Button from '@/components/Button';
import EmptyState from '@/components/EmptyState';
import FilterTabs from '@/components/FilterTabs';
import StatusBadge from '@/components/StatusBadge';
import PostRowActions from '@/features/admin/PostRowActions';
import { listAdminPosts } from '@/features/admin/queries';
import { formatDate } from '@/lib/utils/format';

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
  searchParams: Promise<{ filtro?: string; q?: string }>;
}

export default async function AdminPostsPage({ searchParams }: Props) {
  const { filtro = 'todos', q = '' } = await searchParams;
  const posts = await listAdminPosts(filtro, q);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-title">Posts</h2>
        <Button href="/admin/posts/novo" size="sm">Novo post</Button>
      </div>

      <FilterTabs tabs={tabs} current={filtro} basePath="/admin/posts" />

      <form action="/admin/posts" className="flex gap-2">
        <input type="hidden" name="filtro" value={filtro} />
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Buscar por título..."
          className="h-9 w-full max-w-xs rounded border border-line px-3 text-sm outline-none focus:border-brand"
        />
      </form>

      {posts.length === 0 ? (
        <EmptyState title="Nenhum post encontrado" />
      ) : (
        <div className="card-base overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left text-xs text-muted">
              <tr>
                <th className="p-3">Título</th>
                <th className="p-3">Autor</th>
                <th className="p-3">Status</th>
                <th className="p-3">Moderação</th>
                <th className="p-3">Atualizado</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {posts.map((p) => (
                <tr key={p.id}>
                  <td className="p-3">
                    <Link href={`/post/${p.slug}`} className="font-medium text-title hover:text-brand">
                      {p.title}
                    </Link>
                    {p.category && <span className="block text-xs text-muted">{p.category.name}</span>}
                  </td>
                  <td className="p-3 text-muted">{p.author?.full_name ?? '—'}</td>
                  <td className="p-3"><StatusBadge status={p.status} /></td>
                  <td className="p-3"><StatusBadge status={p.moderation_status} /></td>
                  <td className="p-3 text-muted">{formatDate(p.updated_at)}</td>
                  <td className="p-3">
                    <PostRowActions
                      postId={p.id}
                      status={p.status}
                      moderationStatus={p.moderation_status}
                      isFeatured={p.is_featured}
                    />
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
