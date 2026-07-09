import Link from 'next/link';
import { redirect } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';
import ChangePasswordForm from '@/features/auth/ChangePasswordForm';
import { getCurrentUser } from '@/lib/auth/session';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({
  title: 'Alterar senha',
  path: '/conta/senha',
  noindex: true,
});

export default async function AlterarSenhaPage() {
  const user = await getCurrentUser();
  if (!user?.email) redirect('/login?redirect=/conta/senha');

  return (
    <div className="container-page max-w-md py-8">
      <div className="mb-4">
        <h1 className="text-2xl font-extrabold text-title">Alterar senha</h1>
        <p className="mt-1 text-sm text-muted">{user.email}</p>
      </div>

      <div className="card-base p-5">
        <ChangePasswordForm email={user.email} />
      </div>

      <div className="mt-6 flex items-center justify-between text-sm">
        <Link href="/perfil" className="text-brand hover:underline">
          ← Voltar
        </Link>
        <LogoutButton className="font-bold text-danger hover:underline" />
      </div>
    </div>
  );
}
