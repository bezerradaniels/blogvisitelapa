'use client';

// Ações sobre uma denúncia (admin): remover o conteúdo denunciado ou descartar.
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { removeReportedContent, resolveReport } from '@/features/admin/communityActions';

interface ReportRowActionsProps {
  reportId: string;
  targetType: 'comunidade' | 'topico' | 'resposta';
  targetId: string;
  status: string;
}

export default function ReportRowActions({
  reportId,
  targetType,
  targetId,
  status,
}: ReportRowActionsProps) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function run(fn: () => Promise<{ ok: boolean }>) {
    start(async () => {
      await fn();
      router.refresh();
    });
  }

  const btn = 'rounded px-2 py-1 text-xs font-medium disabled:opacity-50';

  if (status !== 'aberta') {
    return <span className="text-xs text-muted">Resolvida</span>;
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-1">
      <button
        disabled={pending}
        onClick={() => run(() => removeReportedContent(reportId, targetType, targetId))}
        className={`${btn} text-danger hover:bg-surface`}
      >
        Remover conteúdo
      </button>
      <button
        disabled={pending}
        onClick={() => run(() => resolveReport(reportId, 'resolver'))}
        className={`${btn} bg-success/10 text-success hover:bg-success/20`}
      >
        Marcar resolvida
      </button>
      <button
        disabled={pending}
        onClick={() => run(() => resolveReport(reportId, 'descartar'))}
        className={`${btn} text-muted hover:bg-surface`}
      >
        Descartar
      </button>
    </div>
  );
}
