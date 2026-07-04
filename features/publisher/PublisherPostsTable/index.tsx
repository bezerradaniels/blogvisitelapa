// Tabela de posts do publisher (reutilizada em listas por status).
import Link from 'next/link';
import Button from '@/components/Button';
import EmptyState from '@/components/EmptyState';
import StatusBadge from '@/components/StatusBadge';
import { formatDate } from '@/lib/utils/format';

export interface PublisherPostRow {
  id: string;
  title: string;
  status: string;
  moderation_status: string;
  updated_at: string;
}

interface Props {
  posts: PublisherPostRow[];
  emptyTitle?: string;
}

export default function PublisherPostsTable({ posts, emptyTitle = 'Nenhum post por aqui' }: Props) {
  if (posts.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        action={<Button href="/publisher/posts/novo">Criar post</Button>}
      />
    );
  }

  return (
    <div className="card-base overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-surface text-left text-xs text-muted">
          <tr>
            <th className="p-3">Título</th>
            <th className="p-3">Status</th>
            <th className="p-3">Moderação</th>
            <th className="p-3">Atualizado</th>
            <th className="p-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {posts.map((p) => (
            <tr key={p.id}>
              <td className="p-3 font-medium text-title">{p.title}</td>
              <td className="p-3"><StatusBadge status={p.status} /></td>
              <td className="p-3"><StatusBadge status={p.moderation_status} /></td>
              <td className="p-3 text-muted">{formatDate(p.updated_at)}</td>
              <td className="p-3 text-right">
                <Link href={`/publisher/posts/${p.id}/editar`} className="text-brand hover:underline">
                  Editar
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
