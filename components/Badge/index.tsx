import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

type Tone =
  | 'neutral'
  | 'brand'
  | 'accent'
  | 'highlight'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'sponsored';

const tones: Record<Tone, string> = {
  neutral: 'bg-surface text-body',
  brand: 'bg-brand text-white',
  accent: 'bg-accent text-accent-ink',
  highlight: 'bg-highlight text-highlight-ink',
  success: 'bg-brand-soft text-brand-dark',
  warning: 'bg-[#fdeed2] text-warning',
  danger: 'bg-[#fbe0e3] text-danger',
  info: 'bg-blue-50 text-blue-700',
  sponsored: 'bg-highlight text-highlight-ink',
};

interface BadgeProps {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}

// Selo/etiqueta (categorias, status, "Conteúdo patrocinado" etc.).
export default function Badge({ children, tone = 'neutral', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
