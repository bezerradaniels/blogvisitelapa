import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

// Campo de texto com label acessível.
export default function Input({ label, error, id, className, ...props }: InputProps) {
  const fieldId = id ?? props.name;
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={fieldId} className="text-xs font-medium text-body">
          {label}
        </label>
      )}
      <input
        id={fieldId}
        className={cn(
          'h-10 w-full rounded border border-line bg-card px-3 text-sm outline-none focus:border-brand',
          error && 'border-danger',
          className,
        )}
        {...props}
      />
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}
