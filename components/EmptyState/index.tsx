import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

// Estado vazio padrão (listagens sem conteúdo, busca sem resultados).
export default function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="card-base flex flex-col items-center justify-center px-6 py-12 text-center">
      <h3 className="text-base font-bold text-title">{title}</h3>
      {description && <p className="mt-1 max-w-md text-sm text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
