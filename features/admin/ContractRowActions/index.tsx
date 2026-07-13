'use client';

// Ações de status do contrato de publicidade.
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { deleteContract, setContractStatus } from '@/features/admin/adActions';
import type { AdContractStatus } from '@/types/database';

interface ContractRowActionsProps {
  id: string;
  status: string;
}

export default function ContractRowActions({ id, status }: ContractRowActionsProps) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function setStatus(s: AdContractStatus) {
    if (s === 'cancelado' && !window.confirm('Cancelar este contrato? As entregas vinculadas também serão canceladas.')) return;
    start(async () => {
      await setContractStatus(id, s);
      router.refresh();
    });
  }

  function remove() {
    if (!window.confirm('A exclusão física não é permitida. Deseja cancelar este contrato?')) return;
    start(async () => {
      await deleteContract(id);
      router.refresh();
    });
  }

  const btn = 'rounded px-2 py-1 text-xs font-medium disabled:opacity-50';

  return (
    <div className="flex flex-wrap items-center justify-end gap-1">
      {status !== 'ativo' && (
        <button disabled={pending} onClick={() => setStatus('ativo')} className={`${btn} bg-success/10 text-success hover:bg-success/20`}>
          Ativar
        </button>
      )}
      {status === 'ativo' && (
        <button disabled={pending} onClick={() => setStatus('pausado')} className={`${btn} text-warning hover:bg-surface`}>
          Pausar
        </button>
      )}
      {status !== 'cancelado' && (
        <button disabled={pending} onClick={() => setStatus('cancelado')} className={`${btn} text-muted hover:bg-surface`}>
          Cancelar
        </button>
      )}
      <Link href={`/admin/comercial/contratos/${id}`} className={`${btn} text-brand hover:bg-surface`}>
        Abrir
      </Link>
      <button disabled={pending} onClick={remove} className={`${btn} text-danger hover:bg-surface`}>
        Cancelar e arquivar
      </button>
    </div>
  );
}
