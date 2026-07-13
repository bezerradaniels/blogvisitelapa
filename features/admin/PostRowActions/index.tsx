'use client';

// Ações de moderação e edição rápida em cada linha da tabela admin.
import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';
import Icon from '@/components/Icon';
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
  const btn = 'inline-flex h-8 w-8 items-center justify-center rounded-[10px] text-xs font-medium transition-colors disabled:opacity-50';

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
    <div className="flex flex-wrap items-center justify-end gap-1">
      {status !== 'publicado' && (
        <button type="button" title="Publicar" aria-label="Publicar" disabled={pending} onClick={() => run('publicar')} className={`${btn} bg-success/10 text-success hover:bg-success/20`}><Icon icon="Tick02Icon" size={16} /></button>
      )}
      {moderationStatus !== 'aprovado' && status !== 'publicado' && (
        <button type="button" title="Aprovar" aria-label="Aprovar" disabled={pending} onClick={() => run('aprovar')} className={`${btn} text-success hover:bg-surface`}><Icon icon="Tick02Icon" size={16} /></button>
      )}
      {moderationStatus !== 'rejeitado' && (
        <button type="button" title="Rejeitar" aria-label="Rejeitar" disabled={pending} onClick={() => run('rejeitar')} className={`${btn} text-warning hover:bg-surface`}><Icon icon="Cancel01Icon" size={16} /></button>
      )}
      <button type="button" title={isFeatured ? 'Remover destaque' : 'Destacar'} aria-label={isFeatured ? 'Remover destaque' : 'Destacar'} disabled={pending} onClick={() => run(isFeatured ? 'destaque_off' : 'destaque_on')} className={`${btn} text-brand hover:bg-surface`}><Icon icon="StarIcon" size={16} /></button>
      {status !== 'arquivado' && (
        <button type="button" title="Arquivar" aria-label="Arquivar" disabled={pending} onClick={() => run('arquivar')} className={`${btn} text-muted hover:bg-surface`}><Icon icon="Archive02Icon" size={16} /></button>
      )}
      <button type="button" title="Remover" aria-label="Remover" disabled={pending} onClick={() => run('remover', 'Remover este post? Ele deixará de aparecer no site.')} className={`${btn} text-danger hover:bg-surface`}><Icon icon="Delete02Icon" size={16} /></button>
      <button type="button" title="Edição rápida" aria-label="Edição rápida" disabled={pending} onClick={openQuickEdit} className={`${btn} text-body hover:bg-surface`}><Icon icon="PencilEdit02Icon" size={16} /></button>

      <dialog ref={dialogRef} aria-labelledby={`quick-edit-title-${postId}`} className="w-[calc(100%-2rem)] max-w-lg rounded-[10px] border border-line bg-card p-0 text-body shadow-xl backdrop:bg-title/35">
        <form action={submitQuickEdit} className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div><h2 id={`quick-edit-title-${postId}`} className="text-lg font-bold text-title">Edição rápida</h2><p className="mt-1 text-sm text-muted">Atualize os dados principais deste post.</p></div>
            <button type="button" onClick={() => dialogRef.current?.close()} className="flex h-8 w-8 items-center justify-center rounded-[10px] text-muted hover:bg-surface" aria-label="Fechar"><Icon icon="Cancel01Icon" size={18} /></button>
          </div>
          <div className="mt-5 grid gap-4">
            <label className="grid gap-1 text-sm font-medium text-body">Título<input name="title" required minLength={3} defaultValue={title} className="h-10 rounded-[10px] border border-line bg-card px-3 text-sm outline-none focus:border-brand" /></label>
            <label className="grid gap-1 text-sm font-medium text-body">Slug<input name="slug" required defaultValue={slug} className="h-10 rounded-[10px] border border-line bg-card px-3 text-sm outline-none focus:border-brand" /></label>
            <label className="grid gap-1 text-sm font-medium text-body">Autor<select name="authorId" defaultValue={authorId} className="h-10 rounded-[10px] border border-line bg-card px-3 text-sm outline-none focus:border-brand">{authors.map((author) => <option key={author.id} value={author.id}>{author.full_name ?? 'Sem nome'}</option>)}</select></label>
            <label className="grid gap-1 text-sm font-medium text-body">Data de publicação<input name="publishedAt" type="datetime-local" defaultValue={toLocalInput(publishedAt)} className="h-10 rounded-[10px] border border-line bg-card px-3 text-sm outline-none focus:border-brand" /></label>
          </div>
          {error && <p role="alert" className="mt-4 rounded-[10px] bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
          <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => dialogRef.current?.close()} className="h-10 rounded-[10px] border border-line px-4 text-sm font-bold text-body hover:bg-surface">Cancelar</button><button type="submit" disabled={pending} className="h-10 rounded-[10px] bg-brand px-4 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-60">{pending ? 'Salvando...' : 'Salvar alterações'}</button></div>
        </form>
      </dialog>
    </div>
  );
}
