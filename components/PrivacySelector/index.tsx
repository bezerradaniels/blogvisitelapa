'use client';

// Seletor de visibilidade reutilizável (Público / Só amigos / Só eu).
// Controle segmentado baseado em <input type="radio"> nativos (acessível de
// fábrica: teclado, leitor de tela, grupo por `name`). O rótulo textual sempre
// fica acessível — não dependemos só do ícone ou da cor.
import Icon from '@/components/Icon';
import { cn } from '@/lib/utils/cn';
import {
  VISIBILITY_HINT,
  VISIBILITY_ICON,
  VISIBILITY_LABEL,
  effectiveFieldVisibility,
  isLimitedByGlobal,
} from '@/lib/privacy/resolve';
import type { ProfileVisibility } from '@/types/database';

const ORDER: ProfileVisibility[] = ['publico', 'amigos', 'oculto'];

interface PrivacySelectorProps {
  /** Nome único do grupo de rádios (obrigatório p/ acessibilidade). */
  name: string;
  value: ProfileVisibility;
  onChange: (value: ProfileVisibility) => void;
  /** Rótulo do grupo (vira <legend>). */
  legend?: string;
  disabled?: boolean;
  saving?: boolean;
  saved?: boolean;
  error?: string | null;
  /** Visibilidade global do perfil, p/ mostrar quando o global limita o campo. */
  globalVisibility?: ProfileVisibility;
  className?: string;
  size?: 'sm' | 'md';
}

export default function PrivacySelector({
  name,
  value,
  onChange,
  legend,
  disabled = false,
  saving = false,
  saved = false,
  error = null,
  globalVisibility,
  className,
  size = 'md',
}: PrivacySelectorProps) {
  const limited = globalVisibility ? isLimitedByGlobal(value, globalVisibility) : false;
  const effective = globalVisibility ? effectiveFieldVisibility(value, globalVisibility) : value;

  return (
    <fieldset className={cn('min-w-0', className)} disabled={disabled}>
      {legend && <legend className="sr-only">{legend}</legend>}
      <div
        role="radiogroup"
        aria-label={legend ?? 'Visibilidade'}
        className={cn(
          'inline-flex w-full max-w-full rounded-full border border-line bg-surface p-0.5',
          disabled && 'opacity-60',
        )}
      >
        {ORDER.map((opt) => {
          const active = value === opt;
          const id = `${name}-${opt}`;
          return (
            <label
              key={opt}
              htmlFor={id}
              title={VISIBILITY_HINT[opt]}
              className={cn(
                'relative flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full font-bold transition-colors',
                size === 'sm' ? 'min-h-8 px-2 text-xs' : 'min-h-10 px-3 text-sm',
                active ? 'bg-brand text-white shadow-card' : 'text-muted hover:text-brand',
                disabled && 'cursor-not-allowed',
              )}
            >
              <input
                id={id}
                type="radio"
                name={name}
                value={opt}
                checked={active}
                disabled={disabled}
                onChange={() => onChange(opt)}
                className="peer sr-only"
              />
              <Icon icon={VISIBILITY_ICON[opt]} size={size === 'sm' ? 14 : 16} />
              <span className="truncate peer-focus-visible:underline">{VISIBILITY_LABEL[opt]}</span>
            </label>
          );
        })}
      </div>

      <div aria-live="polite" className="mt-1 min-h-4 text-xs">
        {error ? (
          <span className="text-danger">{error}</span>
        ) : saving ? (
          <span className="text-muted">Salvando…</span>
        ) : saved ? (
          <span className="text-brand-dark">Salvo.</span>
        ) : limited ? (
          <span className="text-warning">
            Limitado pelo perfil ({VISIBILITY_LABEL[value]} → {VISIBILITY_LABEL[effective]}).
          </span>
        ) : (
          <span className="text-muted">{VISIBILITY_HINT[value]}</span>
        )}
      </div>
    </fieldset>
  );
}
