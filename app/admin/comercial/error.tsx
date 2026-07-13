'use client';

import Button from '@/components/Button';

export default function ComercialError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert" className="card-base mx-auto max-w-xl p-6 text-center">
      <h1 className="font-headline text-xl font-extrabold text-title">Não foi possível carregar esta área</h1>
      <p className="mt-2 text-sm text-muted">
        A consulta comercial falhou. Tente novamente; se o problema continuar, verifique o acesso às tabelas.
      </p>
      <Button onClick={reset} className="mt-4">Tentar novamente</Button>
    </div>
  );
}
