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

  function run(action: CommentModerationAction, confirmMsg?: string) {
    if (confirmMsg && !confirm(confirmMsg)) return;
    start(async () => {
      await moderateComment(commentId, action);
      router.refresh();
    });
  }

  const btn = 'admin-row-action disabled:opacity-50';

  return (
    <div className="admin-row-actions !visible">
      {status !== 'aprovado' && (
        <button disabled={pending} onClick={() => run('aprovar')} className={btn}>
          Aprovar
        </button>
      )}
      {status !== 'rejeitado' && (
        <button disabled={pending} onClick={() => run('rejeitar')} className={btn}>
          Rejeitar
        </button>
      )}
      {status !== 'removido' && (
        <button disabled={pending} onClick={() => run('remover', 'Mover este comentário para a lixeira?')} className={`${btn} admin-row-action-danger`}>
          Remover
        </button>
      )}
    </div>
  );
}
