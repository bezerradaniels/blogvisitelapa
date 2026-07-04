import type { TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export default function Textarea({ label, error, id, className, ...props }: TextareaProps) {
  const fieldId = id ?? props.name;
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={fieldId} className="text-xs font-medium text-body">
          {label}
        </label>
      )}
      <textarea
        id={fieldId}
        className={cn(
          'w-full rounded border border-line bg-card p-3 text-sm outline-none focus:border-brand',
          error && 'border-danger',
          className,
        )}
        {...props}
      />
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}
