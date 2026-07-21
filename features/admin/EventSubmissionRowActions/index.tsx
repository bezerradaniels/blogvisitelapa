'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import Icon from '@/components/Icon';
import { moderateEventSubmission, type EventSubmissionModerationAction } from '@/features/admin/actions';

export default function EventSubmissionRowActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: EventSubmissionModerationAction) {
    if (action === 'rejeitar' && !confirm('Rejeitar este evento enviado?')) return;
    setError(null);
    startTransition(async () => {
      const result = await moderateEventSubmission(id, action);
      if (!result.ok) setError(result.error ?? 'Não foi possível concluir a ação.');
      else router.refresh();
    });
  }

  if (status !== 'pendente') return null;
  return (
    <div className="flex flex-wrap justify-end gap-1">
      <button type="button" disabled={pending} onClick={() => run('aprovar')} className="inline-flex items-center gap-1 rounded-[10px] px-2 py-1 text-xs font-bold text-success hover:bg-success/10 disabled:opacity-60"><Icon icon="Tick02Icon" size={16} /> Aprovar</button>
      <button type="button" disabled={pending} onClick={() => run('rejeitar')} className="inline-flex items-center gap-1 rounded-[10px] px-2 py-1 text-xs font-bold text-danger hover:bg-danger/10 disabled:opacity-60"><Icon icon="Cancel01Icon" size={16} /> Rejeitar</button>
      {error && <p role="alert" className="w-full text-right text-xs text-danger">{error}</p>}
    </div>
  );
}
