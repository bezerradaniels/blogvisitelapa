import { Suspense } from 'react';
import AuthForm from '@/features/auth/AuthForm';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({ title: 'Entrar', path: '/login', noindex: true });

export default function LoginPage() {
  return (
    <div className="container-page max-w-sm py-10">
      <h1 className="mb-1 text-center text-2xl font-extrabold text-title">Entrar</h1>
      <p className="mb-6 text-center text-sm text-muted">Acesse sua conta no Conecta Lapa.</p>
      <div className="card-base p-5">
        <Suspense fallback={<p className="text-sm text-muted">Carregando...</p>}>
          <AuthForm mode="login" />
        </Suspense>
      </div>

      <div className="mt-6 rounded-lg border border-line bg-section p-4">
        <p className="text-sm font-bold text-title">Com a conta você pode:</p>
        <ul className="mt-2 space-y-1.5 text-sm text-body">
          <li className="flex gap-2">
            <span className="text-brand">✓</span> Acessar a rede social e ter seu perfil (mural, amigos e depoimentos)
          </li>
          <li className="flex gap-2">
            <span className="text-brand">✓</span> Comentar e avaliar as publicações
          </li>
          <li className="flex gap-2">
            <span className="text-brand">✓</span> Participar de comunidades e trocar mensagens
          </li>
          <li className="flex gap-2">
            <span className="text-brand">✓</span> Favoritar conteúdos e receber notificações
          </li>
        </ul>
      </div>
    </div>
  );
}
