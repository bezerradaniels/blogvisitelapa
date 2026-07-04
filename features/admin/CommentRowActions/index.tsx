'use client';

// Botões de moderação de um comentário.
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { moderateComment, type CommentModerationAction } from '@/features/admin/actions';

interface CommentRowActionsProps {
  commentId: string;
  status: string;
}

export default function CommentRowActions({ commentId, status }: CommentRowActionsProps) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function run(action: CommentModerationAction) {
    start(async () => {
      await moderateComment(commentId, action);
      router.refresh();
    });
  }

  const btn = 'rounded px-2 py-1 text-xs font-medium disabled:opacity-50';

  return (
    <div className="flex flex-wrap items-center justify-end gap-1">
      {status !== 'aprovado' && (
        <button disabled={pending} onClick={() => run('aprovar')} className={`${btn} bg-success/10 text-success hover:bg-success/20`}>
          Aprovar
        </button>
      )}
      {status !== 'rejeitado' && (
        <button disabled={pending} onClick={() => run('rejeitar')} className={`${btn} text-warning hover:bg-surface`}>
          Rejeitar
        </button>
      )}
      {status !== 'removido' && (
        <button disabled={pending} onClick={() => run('remover')} className={`${btn} text-danger hover:bg-surface`}>
          Remover
        </button>
      )}
    </div>
  );
}
