import { Suspense } from 'react';
import AuthForm from '@/features/auth/AuthForm';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({ title: 'Entrar', path: '/login', noindex: true });

export default function LoginPage() {
  return (
    <div className="container-page max-w-sm py-10">
      <h1 className="mb-1 text-center text-2xl font-extrabold text-title">Entrar</h1>
      <p className="mb-6 text-center text-sm text-muted">Acesse sua conta no Visite Lapa.</p>
      <div className="card-base p-5">
        <Suspense fallback={<p className="text-sm text-muted">Carregando...</p>}>
          <AuthForm mode="login" />
        </Suspense>
      </div>
    </div>
  );
}
