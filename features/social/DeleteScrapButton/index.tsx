'use client';

// Remove um recado (dono do mural ou autor).
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { deleteScrap } from '@/features/social/actions';

export default function DeleteScrapButton({ scrapId }: { scrapId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await deleteScrap(scrapId);
          if (res.ok) router.refresh();
        })
      }
      className="text-xs font-semibold text-danger hover:underline"
    >
      Excluir
    </button>
  );
}
