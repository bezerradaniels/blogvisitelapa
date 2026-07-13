'use client';

// Seletor de status + exclusão para leads (contatos/anunciantes).
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import type { ContactStatus } from '@/types/database';

const STATUS_OPTIONS: { value: ContactStatus; label: string }[] = [
  { value: 'novo', label: 'Novo' },
  { value: 'lido', label: 'Lido' },
  { value: 'em_atendimento', label: 'Em atendimento' },
  { value: 'concluido', label: 'Concluído' },
  { value: 'arquivado', label: 'Arquivado' },
];

interface ContactStatusControlProps {
  id: string;
  status: ContactStatus;
  onSetStatus: (id: string, status: ContactStatus) => Promise<{ ok: boolean }>;
  onDelete: (id: string) => Promise<{ ok: boolean }>;
}

export default function ContactStatusControl({ id, status, onSetStatus, onDelete }: ContactStatusControlProps) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <select
        value={status}
        disabled={pending}
        onChange={(e) =>
          start(async () => {
            await onSetStatus(id, e.target.value as ContactStatus);
            router.refresh();
          })
        }
        className="h-8 rounded border border-line bg-card px-2 text-xs outline-none focus:border-brand"
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!window.confirm('Excluir este lead? Esta ação não poderá ser desfeita.')) return;
          start(async () => {
            await onDelete(id);
            router.refresh();
          });
        }}
        className="text-xs text-danger hover:underline disabled:opacity-50"
      >
        Excluir
      </button>
    </div>
  );
}
