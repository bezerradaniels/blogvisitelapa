import Link from 'next/link';
import ResetRequestForm from '@/features/auth/ResetRequestForm';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({
  title: 'Recuperar senha',
  path: '/recuperar-senha',
  noindex: true,
});

export default function RecuperarSenhaPage() {
  return (
    <div className="container-page max-w-sm py-10">
      <h1 className="mb-1 text-center text-2xl font-extrabold text-title">Recuperar senha</h1>
      <p className="mb-6 text-center text-sm text-muted">
        Informe seu e-mail e enviaremos um link para criar uma nova senha.
      </p>
      <div className="card-base p-5">
        <ResetRequestForm />
      </div>
      <p className="mt-4 text-center text-sm text-muted">
        Lembrou a senha?{' '}
        <Link href="/login" className="text-brand underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
