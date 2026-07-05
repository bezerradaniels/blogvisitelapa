'use client';

// Controles de moderação de um tópico (dono/moderador/admin): fixar, travar e
// remover. Aparecem apenas para quem tem permissão.
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import {
  setTopicStatus,
  toggleTopicLock,
  toggleTopicPin,
} from '@/features/communities/actions';

interface TopicModActionsProps {
  topicId: string;
  communitySlug: string;
  isPinned: boolean;
  isLocked: boolean;
}

export default function TopicModActions({
  topicId,
  communitySlug,
  isPinned,
  isLocked,
}: TopicModActionsProps) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function run(fn: () => Promise<{ ok: boolean }>, redirectToCommunity = false) {
    start(async () => {
      const res = await fn();
      if (res.ok) {
        if (redirectToCommunity) router.push(`/comunidades/${communitySlug}`);
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
      <span className="text-muted">Moderação:</span>
      <button
        type="button"
        disabled={pending}
        onClick={() => run(() => toggleTopicPin(topicId, !isPinned))}
        className="text-brand hover:underline"
      >
        {isPinned ? 'Desafixar' : 'Fixar'}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => run(() => toggleTopicLock(topicId, !isLocked))}
        className="text-brand hover:underline"
      >
        {isLocked ? 'Reabrir' : 'Fechar'}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => run(() => setTopicStatus(topicId, 'removido'), true)}
        className="text-danger hover:underline"
      >
        Remover tópico
      </button>
    </div>
  );
}
