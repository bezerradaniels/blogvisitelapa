import type { InputHTMLAttributes } from 'react';
import Icon from '@/components/Icon';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
}

// Checkbox circular (mesmo estilo do checklist): input nativo escondido +
// indicador redondo com "tick" da marca quando marcado.
export default function Checkbox({ label, id, checked, ...props }: CheckboxProps) {
  const fieldId = id ?? props.name;
  return (
    <label htmlFor={fieldId} className="flex cursor-pointer items-center gap-2 text-sm text-body">
      <span className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center">
        <input
          id={fieldId}
          type="checkbox"
          checked={checked}
          className="peer absolute inset-0 cursor-pointer opacity-0"
          {...props}
        />
        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-line bg-card text-transparent transition-colors peer-checked:border-brand peer-checked:bg-brand peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-brand/30">
          <Icon icon="Tick02Icon" size={12} strokeWidth={3} />
        </span>
      </span>
      {label}
    </label>
  );
}
