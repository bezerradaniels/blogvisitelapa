'use client';

// Bloquear/desbloquear um usuário (com confirmação ao bloquear).
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { blockUser, unblockUser } from '@/features/social/actions';

interface BlockButtonProps {
  targetProfileId: string;
  blocked: boolean;
}

export default function BlockButton({ targetProfileId, blocked }: BlockButtonProps) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function toggle() {
    if (!blocked && !confirm('Bloquear este usuário? A amizade será desfeita.')) return;
    start(async () => {
      const res = blocked ? await unblockUser(targetProfileId) : await blockUser(targetProfileId);
      if (res.ok) router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className="text-xs font-semibold text-danger hover:underline disabled:opacity-50"
    >
      {pending ? '...' : blocked ? 'Desbloquear' : 'Bloquear'}
    </button>
  );
}
