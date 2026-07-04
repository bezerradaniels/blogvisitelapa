import type { ReactNode } from 'react';

interface ProsePageProps {
  title: string;
  updatedAt?: string;
  children: ReactNode;
}

// Layout de página de texto (institucional/legal).
export default function ProsePage({ title, updatedAt, children }: ProsePageProps) {
  return (
    <div className="container-page max-w-3xl py-8">
      <h1 className="text-2xl font-extrabold text-title md:text-3xl">{title}</h1>
      {updatedAt && <p className="mt-1 text-xs text-muted">Atualizado em {updatedAt}</p>}
      <div className="prose-post mt-6">{children}</div>
    </div>
  );
}
