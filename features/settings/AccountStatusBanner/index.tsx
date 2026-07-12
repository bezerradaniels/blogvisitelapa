'use client';

// Banner exibido nas Configurações quando a conta não está ativa: permite
// reativar (desativada) ou cancelar a exclusão (exclusão pendente).
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { cancelAccountDeletion, reactivateAccount } from '@/features/settings/account';

export default function AccountStatusBanner({
  status,
}: {
  status: 'deactivated' | 'pending_deletion';
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setError(null);
    setLoading(true);
    const res = status === 'deactivated' ? await reactivateAccount() : await cancelAccountDeletion();
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? 'Não foi possível concluir.');
      return;
    }
    router.refresh();
  }

  const isDeletion = status === 'pending_deletion';

  return (
    <div
      role="alert"
      className={`mb-4 rounded-lg border p-4 ${
        isDeletion ? 'border-danger/40 bg-danger/5' : 'border-warning/40 bg-warning/10'
      }`}
    >
      <p className="text-sm font-bold text-title">
        {isDeletion ? 'Sua conta está marcada para exclusão' : 'Sua conta está desativada'}
      </p>
      <p className="mt-0.5 text-sm text-body">
        {isDeletion
          ? 'Ela está oculta e será apagada de forma definitiva após 30 dias do pedido. Você pode cancelar agora.'
          : 'Seu perfil está oculto para outras pessoas. Reative para voltar a aparecer.'}
      </p>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      <button
        type="button"
        onClick={run}
        disabled={loading}
        className={`mt-3 inline-flex min-h-9 items-center rounded-full px-4 text-sm font-bold text-white disabled:opacity-60 ${
          isDeletion ? 'bg-danger hover:brightness-95' : 'bg-brand hover:bg-brand-dark'
        }`}
      >
        {loading ? 'Processando…' : isDeletion ? 'Cancelar exclusão' : 'Reativar conta'}
      </button>
    </div>
  );
}
