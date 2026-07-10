import type { SelectHTMLAttributes } from 'react';
import Icon from '@/components/Icon';
import { cn } from '@/lib/utils/cn';

interface Option {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Option[];
  placeholder?: string;
}

export default function Select({
  label,
  error,
  options,
  placeholder,
  id,
  className,
  ...props
}: SelectProps) {
  const fieldId = id ?? props.name;
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={fieldId} className="text-xs font-medium text-body">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={fieldId}
          className={cn(
            'h-10 w-full appearance-none rounded-[10px] border border-line bg-card pl-3 pr-9 text-sm text-body outline-none transition-colors hover:border-mint2 focus:border-brand focus:ring-2 focus:ring-brand/20',
            error && 'border-danger',
            className,
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {/* Seta customizada (esconde a nativa via appearance-none) */}
        <Icon
          icon="ArrowRight01Icon"
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-muted"
        />
      </div>
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}
