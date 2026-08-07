'use client';

// Ações de moderação e edição rápida em cada linha da tabela admin.
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';
import { moderatePost, quickEditPost, type PostModerationAction } from '@/features/admin/actions';
import type { PostAuthorOption } from '@/features/admin/queries';

interface PostRowActionsProps {
  postId: string;
  title: string;
  slug: string;
  authorId: string;
  publishedAt: string | null;
  authors: PostAuthorOption[];
  status: string;
  moderationStatus: string;
  isFeatured: boolean;
}

function toLocalInput(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function PostRowActions({
  postId, title, slug, authorId, publishedAt, authors, status, moderationStatus, isFeatured,
}: PostRowActionsProps) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const actionClass = 'admin-row-action disabled:cursor-wait disabled:opacity-50';

  function run(action: PostModerationAction, confirmMsg?: string) {
    if (confirmMsg && !confirm(confirmMsg)) return;
    start(async () => {
      await moderatePost(postId, action);
      router.refresh();
    });
  }

  function openQuickEdit() {
    setError(null);
    dialogRef.current?.showModal();
  }

  function submitQuickEdit(formData: FormData) {
    const localDate = String(formData.get('publishedAt') ?? '');
    start(async () => {
      const result = await quickEditPost({
        postId,
        title: String(formData.get('title') ?? ''),
        slug: String(formData.get('slug') ?? ''),
        authorId: String(formData.get('authorId') ?? ''),
        publishedAt: localDate ? new Date(localDate).toISOString() : null,
      });
      if (!result.ok) {
        setError(result.error ?? 'Não foi possível salvar as alterações.');
        return;
      }
      dialogRef.current?.close();
      router.refresh();
    });
  }

  return (
    <div className="admin-row-actions" aria-label={`Ações de ${title}`}>
      <Link href={`/admin/posts/${postId}/editar`} className={actionClass}>Editar</Link>
      <button type="button" disabled={pending} onClick={openQuickEdit} className={actionClass}>Edição rápida</button>
      <Link href={`/post/${slug}`} className={actionClass}>Ver</Link>
      {status !== 'publicado' && (
        <button type="button" disabled={pending} onClick={() => run('publicar')} className={actionClass}>Publicar</button>
      )}
      {moderationStatus !== 'aprovado' && status !== 'publicado' && (
        <button type="button" disabled={pending} onClick={() => run('aprovar')} className={actionClass}>Aprovar</button>
      )}
      {moderationStatus !== 'rejeitado' && (
        <button type="button" disabled={pending} onClick={() => run('rejeitar')} className={actionClass}>Rejeitar</button>
      )}
      <button type="button" disabled={pending} onClick={() => run(isFeatured ? 'destaque_off' : 'destaque_on')} className={actionClass}>{isFeatured ? 'Tirar destaque' : 'Destacar'}</button>
      {status !== 'arquivado' && (
        <button type="button" disabled={pending} onClick={() => run('arquivar')} className={actionClass}>Arquivar</button>
      )}
      <button type="button" disabled={pending} onClick={() => run('remover', 'Remover este post? Ele deixará de aparecer no site.')} className={`${actionClass} admin-row-action-danger`}>Remover</button>

      <dialog ref={dialogRef} aria-labelledby={`quick-edit-title-${postId}`} className="admin-dialog w-[calc(100%-2rem)] max-w-lg border bg-white p-0 text-[#1d2327] shadow-xl backdrop:bg-black/35">
        <form action={submitQuickEdit} className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div><h2 id={`quick-edit-title-${postId}`} className="text-lg font-bold text-title">Edição rápida</h2><p className="mt-1 text-sm text-muted">Atualize os dados principais deste post.</p></div>
            <button type="button" onClick={() => dialogRef.current?.close()} className="flex h-8 w-8 items-center justify-center text-xl text-[#646970] hover:bg-[#f0f0f1]" aria-label="Fechar">×</button>
          </div>
          <div className="mt-5 grid gap-4">
            <label className="grid gap-1 text-sm font-medium">Título<input name="title" required minLength={3} defaultValue={title} className="admin-control" /></label>
            <label className="grid gap-1 text-sm font-medium">Slug<input name="slug" required defaultValue={slug} className="admin-control" /></label>
            <label className="grid gap-1 text-sm font-medium">Autor<select name="authorId" defaultValue={authorId} className="admin-control">{authors.map((author) => <option key={author.id} value={author.id}>{author.full_name ?? 'Sem nome'}</option>)}</select></label>
            <label className="grid gap-1 text-sm font-medium">Data de publicação<input name="publishedAt" type="datetime-local" defaultValue={toLocalInput(publishedAt)} className="admin-control" /></label>
          </div>
          {error && <p role="alert" className="mt-4 rounded-[10px] bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
          <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => dialogRef.current?.close()} className="admin-button">Cancelar</button><button type="submit" disabled={pending} className="admin-button admin-button-primary disabled:opacity-60">{pending ? 'Salvando...' : 'Salvar alterações'}</button></div>
        </form>
      </dialog>
    </div>
  );
}
