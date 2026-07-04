import { Suspense } from 'react';
import AuthForm from '@/features/auth/AuthForm';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({ title: 'Criar conta', path: '/cadastro', noindex: true });

export default function CadastroPage() {
  return (
    <div className="container-page max-w-sm py-10">
      <h1 className="mb-1 text-center text-2xl font-extrabold text-title">Criar conta</h1>
      <p className="mb-6 text-center text-sm text-muted">
        Participe: comente, avalie e salve seus conteúdos favoritos.
      </p>
      <div className="card-base p-5">
        <Suspense fallback={<p className="text-sm text-muted">Carregando...</p>}>
          <AuthForm mode="signup" />
        </Suspense>
      </div>
    </div>
  );
}
