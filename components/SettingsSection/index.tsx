import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

// Cabeçalho padrão de uma página de configurações (título + descrição curta).
export function SettingsHeader({ title, description }: { title: string; description?: string }) {
  return (
    <header className="mb-5">
      <h1 className="text-xl font-extrabold text-title sm:text-2xl">{title}</h1>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
    </header>
  );
}

// Bloco/cartão de uma seção dentro de uma página de configurações.
export default function SettingsSection({
  title,
  description,
  children,
  className,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('card-base p-4 sm:p-5', className)}>
      {(title || description) && (
        <div className="mb-4">
          {title && <h2 className="text-base font-extrabold text-title">{title}</h2>}
          {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
        </div>
      )}
      {children}
    </section>
  );
}
