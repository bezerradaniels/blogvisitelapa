'use client';

// Botão "Denunciar" com um pequeno diálogo para escolher o motivo.
import { useState } from 'react';
import Button from '@/components/Button';
import { reportContent } from '@/features/communities/actions';
import { REPORT_REASONS } from '@/lib/config/communities';
import type { CommunityReportTarget, ReportReason } from '@/types/database';

interface ReportButtonProps {
  targetType: CommunityReportTarget;
  targetId: string;
}

export default function ReportButton({ targetType, targetId }: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>('spam');
  const [details, setDetails] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setState('loading');
    const res = await reportContent({ targetType, targetId, reason, details });
    if (!res.ok) {
      setState('idle');
      setError(res.error ?? 'Não foi possível denunciar.');
      return;
    }
    setState('done');
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-semibold text-muted hover:text-danger"
      >
        Denunciar
      </button>
    );
  }

  if (state === 'done') {
    return <span className="text-xs font-semibold text-brand-dark">Denúncia registrada. Obrigado.</span>;
  }

  return (
    <form onSubmit={submit} className="card-base mt-2 space-y-2 p-3">
      <p className="text-xs font-bold text-title">Denunciar conteúdo</p>
      <select
        value={reason}
        onChange={(e) => setReason(e.target.value as ReportReason)}
        className="h-9 w-full rounded border border-line bg-card px-2 text-sm outline-none focus:border-brand"
      >
        {REPORT_REASONS.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
      <textarea
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        rows={2}
        maxLength={2000}
        placeholder="Detalhes (opcional)"
        className="w-full rounded border border-line bg-card p-2 text-sm outline-none focus:border-brand"
      />
      {error && <p className="text-xs text-danger">{error}</p>}
      <div className="flex items-center gap-2">
        <Button size="sm" variant="danger" disabled={state === 'loading'}>
          {state === 'loading' ? 'Enviando...' : 'Enviar denúncia'}
        </Button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs font-semibold text-muted hover:underline"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
