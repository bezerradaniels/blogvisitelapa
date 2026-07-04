import Link from 'next/link';
import EmptyState from '@/components/EmptyState';
import FilterTabs from '@/components/FilterTabs';
import StatusBadge from '@/components/StatusBadge';
import CommentRowActions from '@/features/admin/CommentRowActions';
import { listAdminComments } from '@/features/admin/queries';
import { formatDateTime } from '@/lib/utils/format';

export const dynamic = 'force-dynamic';

const tabs = [
  { label: 'Pendentes', value: 'pendentes' },
  { label: 'Aprovados', value: 'aprovado' },
  { label: 'Rejeitados', value: 'rejeitado' },
  { label: 'Removidos', value: 'removido' },
  { label: 'Todos', value: 'todos' },
];

interface Props {
  searchParams: Promise<{ filtro?: string }>;
}

export default async function AdminCommentsPage({ searchParams }: Props) {
  const { filtro = 'pendentes' } = await searchParams;
  const comments = await listAdminComments(filtro);

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold text-title">Comentários</h2>
      <p className="text-xs text-muted">
        Política: todos os comentários exigem aprovação antes de aparecer no site.
      </p>

      <FilterTabs tabs={tabs} current={filtro} basePath="/admin/comentarios" />

      {comments.length === 0 ? (
        <EmptyState title="Nenhum comentário nesta visão" />
      ) : (
        <ul className="space-y-2">
          {comments.map((c) => (
            <li key={c.id} className="card-base p-3">
              <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                <span className="font-medium text-title">{c.author?.full_name ?? 'Leitor'}</span>
                <span aria-hidden>·</span>
                <time dateTime={c.created_at}>{formatDateTime(c.created_at)}</time>
                <StatusBadge status={c.status} />
                {c.post && (
                  <Link href={`/post/${c.post.slug}`} className="text-brand hover:underline">
                    em “{c.post.title}”
                  </Link>
                )}
              </div>
              <p className="text-sm text-body">{c.content}</p>
              <div className="mt-2">
                <CommentRowActions commentId={c.id} status={c.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
