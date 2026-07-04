'use client';

// Botões de moderação de um post (linha da tabela admin).
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { moderatePost, type PostModerationAction } from '@/features/admin/actions';

interface PostRowActionsProps {
  postId: string;
  status: string;
  moderationStatus: string;
  isFeatured: boolean;
}

export default function PostRowActions({ postId, status, moderationStatus, isFeatured }: PostRowActionsProps) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function run(action: PostModerationAction) {
    start(async () => {
      await moderatePost(postId, action);
      router.refresh();
    });
  }

  const btn = 'rounded px-2 py-1 text-xs font-medium disabled:opacity-50';

  return (
    <div className="flex flex-wrap items-center justify-end gap-1">
      {status !== 'publicado' && (
        <button disabled={pending} onClick={() => run('publicar')} className={`${btn} bg-success/10 text-success hover:bg-success/20`}>
          Publicar
        </button>
      )}
      {moderationStatus !== 'aprovado' && status !== 'publicado' && (
        <button disabled={pending} onClick={() => run('aprovar')} className={`${btn} text-success hover:bg-surface`}>
          Aprovar
        </button>
      )}
      {moderationStatus !== 'rejeitado' && (
        <button disabled={pending} onClick={() => run('rejeitar')} className={`${btn} text-warning hover:bg-surface`}>
          Rejeitar
        </button>
      )}
      <button disabled={pending} onClick={() => run(isFeatured ? 'destaque_off' : 'destaque_on')} className={`${btn} text-brand hover:bg-surface`}>
        {isFeatured ? 'Remover destaque' : 'Destacar'}
      </button>
      {status !== 'arquivado' && (
        <button disabled={pending} onClick={() => run('arquivar')} className={`${btn} text-muted hover:bg-surface`}>
          Arquivar
        </button>
      )}
      <button disabled={pending} onClick={() => run('remover')} className={`${btn} text-danger hover:bg-surface`}>
        Remover
      </button>
      <Link href={`/admin/posts/${postId}/editar`} className={`${btn} text-body hover:bg-surface`}>
        Editar
      </Link>
    </div>
  );
}
