'use client';

// Presets de privacidade: aplicam a visibilidade a TODOS os campos de uma vez.
// Exigem confirmação (mudança ampla) e nunca tocam em credenciais/segurança.
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import Icon from '@/components/Icon';
import { applyPrivacyPreset } from '@/features/settings/actions';

const PRESETS = [
  { key: 'publico', label: 'Perfil público', icon: 'GlobalIcon', hint: 'A maioria dos campos fica visível para todos (telefone continua protegido).' },
  { key: 'amigos', label: 'Focado em amigos', icon: 'UserMultiple02Icon', hint: 'Suas informações ficam visíveis apenas para amigos confirmados.' },
  { key: 'privado', label: 'Perfil privado', icon: 'SquareLock02Icon', hint: 'Quase tudo fica visível apenas para você.' },
] as const;

export default function PresetButtons() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirming, setConfirming] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function apply(key: 'publico' | 'amigos' | 'privado') {
    setError(null);
    start(async () => {
      const res = await applyPrivacyPreset(key);
      setConfirming(null);
      if (!res.ok) {
        setError(res.error ?? 'Não foi possível aplicar.');
        return;
      }
      setDone(true);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-3">
        {PRESETS.map((p) => (
          <div key={p.key} className="rounded-[10px] border border-line p-3">
            <div className="flex items-center gap-2 text-sm font-bold text-title">
              <Icon icon={p.icon} size={16} />
              {p.label}
            </div>
            <p className="mt-1 text-xs text-muted">{p.hint}</p>
            {confirming === p.key ? (
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => apply(p.key)}
                  disabled={pending}
                  className="inline-flex min-h-8 items-center rounded-full bg-brand px-3 text-xs font-bold text-white hover:bg-brand-dark disabled:opacity-60"
                >
                  {pending ? 'Aplicando…' : 'Confirmar'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(null)}
                  className="inline-flex min-h-8 items-center rounded-full border border-line px-3 text-xs font-bold text-body hover:bg-surface"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setConfirming(p.key);
                  setDone(false);
                }}
                className="mt-3 inline-flex min-h-8 items-center rounded-full border border-line px-3 text-xs font-bold text-brand hover:bg-surface"
              >
                Aplicar
              </button>
            )}
          </div>
        ))}
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      {done && <p className="text-sm text-brand-dark">Preset aplicado. Revise os campos em “Perfil e privacidade”.</p>}
      <p className="text-xs text-muted">
        Aplicar um preset substitui a visibilidade individual dos campos. Você pode ajustar
        cada campo depois em “Perfil e privacidade”.
      </p>
    </div>
  );
}
