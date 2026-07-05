'use client';

// Ações de moderação de uma comunidade (admin).
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { setCommunityStatus } from '@/features/admin/communityActions';
import type { CommunityStatus } from '@/types/database';

interface CommunityRowActionsProps {
  communityId: string;
  status: string;
}

export default function CommunityRowActions({ communityId, status }: CommunityRowActionsProps) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function run(next: CommunityStatus) {
    start(async () => {
      await setCommunityStatus(communityId, next);
      router.refresh();
    });
  }

  const btn = 'rounded px-2 py-1 text-xs font-medium disabled:opacity-50';

  return (
    <div className="flex flex-wrap items-center justify-end gap-1">
      {status !== 'ativa' && (
        <button disabled={pending} onClick={() => run('ativa')} className={`${btn} bg-success/10 text-success hover:bg-success/20`}>
          Reativar
        </button>
      )}
      {status !== 'suspensa' && (
        <button disabled={pending} onClick={() => run('suspensa')} className={`${btn} text-warning hover:bg-surface`}>
          Suspender
        </button>
      )}
      {status !== 'removida' && (
        <button disabled={pending} onClick={() => run('removida')} className={`${btn} text-danger hover:bg-surface`}>
          Remover
        </button>
      )}
    </div>
  );
}
