import type { InputHTMLAttributes } from 'react';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
}

// Checkbox com label acessível.
export default function Checkbox({ label, id, ...props }: CheckboxProps) {
  const fieldId = id ?? props.name;
  return (
    <label htmlFor={fieldId} className="flex cursor-pointer items-center gap-2 text-sm text-body">
      <input
        id={fieldId}
        type="checkbox"
        className="h-4 w-4 rounded border-line text-brand focus:ring-brand"
        {...props}
      />
      {label}
    </label>
  );
}
