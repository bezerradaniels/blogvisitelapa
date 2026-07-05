'use client';

// Remove uma resposta (moderação: dono/moderador/admin).
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { setReplyStatus } from '@/features/communities/actions';

export default function RemoveReplyButton({ replyId }: { replyId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function remove() {
    start(async () => {
      const res = await setReplyStatus(replyId, 'removido');
      if (res.ok) router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={remove}
      disabled={pending}
      className="text-xs font-semibold text-danger hover:underline"
    >
      Remover
    </button>
  );
}
