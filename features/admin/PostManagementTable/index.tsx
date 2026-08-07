'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import PostRowActions from '@/features/admin/PostRowActions';
import { moderatePost, type PostModerationAction } from '@/features/admin/actions';
import type { AdminPostRow, PostAuthorOption } from '@/features/admin/queries';
import { formatDate, titleCase } from '@/lib/utils/format';

interface Props {
  posts: AdminPostRow[];
  authors: PostAuthorOption[];
}

const statusLabels: Record<string, string> = {
  rascunho: 'Rascunho',
  enviado_para_revisao: 'Em revisão',
  publicado: 'Publicado',
  arquivado: 'Arquivado',
  removido: 'Removido',
};

export default function PostManagementTable({ posts, authors }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const allSelected = posts.length > 0 && posts.every((post) => selected.has(post.id));
  const selectedCount = selected.size;
  const selectedIds = useMemo(() => [...selected], [selected]);

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(posts.map((post) => post.id)));
  }

  function toggleOne(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function applyBulkAction() {
    if (!bulkAction || selectedIds.length === 0) {
      setMessage('Selecione uma ação e pelo menos um post.');
      return;
    }
    if (bulkAction === 'remover' && !confirm(`Remover ${selectedIds.length} post(s)? Eles deixarão de aparecer no site.`)) return;
    startTransition(async () => {
      const results = await Promise.all(selectedIds.map((id) => moderatePost(id, bulkAction as PostModerationAction)));
      const failures = results.filter((result) => !result.ok).length;
      setMessage(failures ? `${failures} post(s) não puderam ser atualizados.` : `${selectedIds.length} post(s) atualizados.`);
      if (!failures) setSelected(new Set());
      router.refresh();
    });
  }

  const bulkControls = (
    <div className="flex flex-wrap items-center gap-1.5">
      <label className="sr-only" htmlFor="admin-post-bulk-action">Ações em massa</label>
      <select id="admin-post-bulk-action" className="admin-control w-auto min-w-40" value={bulkAction} onChange={(event) => setBulkAction(event.target.value)} disabled={pending}>
        <option value="">Ações em massa</option>
        <option value="publicar">Publicar</option>
        <option value="arquivar">Arquivar</option>
        <option value="destaque_on">Destacar</option>
        <option value="destaque_off">Tirar destaque</option>
        <option value="remover">Remover</option>
      </select>
      <button type="button" className="admin-button" onClick={applyBulkAction} disabled={pending}>{pending ? 'Aplicando…' : 'Aplicar'}</button>
      {selectedCount > 0 && <span className="text-xs text-[#646970]">{selectedCount} selecionado(s)</span>}
    </div>
  );

  return (
    <div className="space-y-2">
      <div className="flex min-h-8 flex-wrap items-center justify-between gap-2">
        {bulkControls}
        {message && <p role="status" className="text-xs text-[#50575e]">{message}</p>}
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <td className="admin-check-column"><input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Selecionar todos os posts desta página" /></td>
              <th scope="col">Título</th>
              <th scope="col" className="admin-column-author">Autor</th>
              <th scope="col" className="admin-column-category">Categoria</th>
              <th scope="col" className="admin-column-date">Data</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => {
              const status = statusLabels[post.status] ?? post.status;
              return (
                <tr key={post.id}>
                  <th scope="row" className="admin-check-column"><input type="checkbox" checked={selected.has(post.id)} onChange={() => toggleOne(post.id)} aria-label={`Selecionar ${post.title}`} /></th>
                  <td className="admin-title-column">
                    <div>
                      <Link href={`/admin/posts/${post.id}/editar`} className="admin-title-link">{post.title}</Link>
                      {post.status !== 'publicado' && <span className="font-normal text-[#50575e]"> — {status}</span>}
                      {post.is_featured && <span className="admin-featured-label">Destaque</span>}
                    </div>
                    <PostRowActions
                      postId={post.id}
                      title={post.title}
                      slug={post.slug}
                      authorId={post.author_id}
                      publishedAt={post.published_at}
                      authors={authors}
                      status={post.status}
                      moderationStatus={post.moderation_status}
                      isFeatured={post.is_featured}
                    />
                  </td>
                  <td className="admin-column-author">{post.author?.full_name ? titleCase(post.author.full_name) : '—'}</td>
                  <td className="admin-column-category">{post.category ? <Link href={`/admin/posts?categoria=${post.category.id}`} className="admin-link">{post.category.name}</Link> : '—'}</td>
                  <td className="admin-column-date"><span className="block text-xs">{post.status === 'publicado' ? 'Publicado' : 'Última modificação'}</span>{formatDate(post.published_at ?? post.updated_at)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td className="admin-check-column"><input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Selecionar todos os posts desta página" /></td>
              <th scope="col">Título</th>
              <th scope="col" className="admin-column-author">Autor</th>
              <th scope="col" className="admin-column-category">Categoria</th>
              <th scope="col" className="admin-column-date">Data</th>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
