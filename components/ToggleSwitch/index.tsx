'use client';

// Interruptor acessível (switch) baseado em checkbox nativo. Rótulo + descrição
// à esquerda, switch à direita. Usa os tokens do tema.
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: ReactNode;
  disabled?: boolean;
  name?: string;
}

export default function ToggleSwitch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  name,
}: ToggleSwitchProps) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start justify-between gap-3 py-3',
        disabled && 'cursor-not-allowed opacity-60',
      )}
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-title">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-muted">{description}</span>}
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input
          type="checkbox"
          role="switch"
          name={name}
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className="h-6 w-11 rounded-full bg-line transition-colors peer-checked:bg-brand peer-focus-visible:ring-2 peer-focus-visible:ring-brand/30"
        />
        <span
          aria-hidden
          className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-card transition-transform peer-checked:translate-x-5"
        />
      </span>
    </label>
  );
}
