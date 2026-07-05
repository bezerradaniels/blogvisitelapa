import Link from 'next/link';
import EmptyState from '@/components/EmptyState';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Visão agregada de avaliações por post (média e total).
export default async function AdminAvaliacoesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('posts')
    .select('id, title, slug, rating_avg, rating_count')
    .gt('rating_count', 0)
    .order('rating_count', { ascending: false })
    .limit(200);
  const posts = data ?? [];

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold text-title">Avaliações</h2>
      {posts.length === 0 ? (
        <EmptyState title="Nenhuma avaliação registrada ainda" />
      ) : (
        <div className="card-base overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left text-xs text-muted">
              <tr>
                <th className="p-3">Post</th>
                <th className="p-3">Média</th>
                <th className="p-3">Avaliações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {posts.map((p) => (
                <tr key={p.id}>
                  <td className="p-3">
                    <Link href={`/post/${p.slug}`} className="font-medium text-title hover:text-brand">{p.title}</Link>
                  </td>
                  <td className="p-3 font-medium text-amber-600">{p.rating_avg.toFixed(1)} ★</td>
                  <td className="p-3 text-muted">{p.rating_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
