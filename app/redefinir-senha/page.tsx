import ResetPasswordForm from '@/features/auth/ResetPasswordForm';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({
  title: 'Redefinir senha',
  path: '/redefinir-senha',
  noindex: true,
});

export default function RedefinirSenhaPage() {
  return (
    <div className="container-page max-w-sm py-10">
      <h1 className="mb-1 text-center text-2xl font-extrabold text-title">Redefinir senha</h1>
      <p className="mb-6 text-center text-sm text-muted">Escolha uma nova senha para sua conta.</p>
      <div className="card-base p-5">
        <ResetPasswordForm />
      </div>
    </div>
  );
}
