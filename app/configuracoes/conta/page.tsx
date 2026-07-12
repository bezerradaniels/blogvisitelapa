import Link from 'next/link';
import { SettingsHeader } from '@/components/SettingsSection';
import AccountForm from '@/features/settings/AccountForm';
import { getCurrentUser } from '@/lib/auth/session';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({ title: 'Conta', path: '/configuracoes/conta', noindex: true });

export default async function ContaPage() {
  const user = await getCurrentUser();
  const profile = user!.profile!;

  return (
    <div className="space-y-5">
      <SettingsHeader title="Conta" description="Suas informações básicas e de acesso." />
      <AccountForm
        initial={{
          full_name: profile.full_name ?? '',
          username: profile.slug ?? '',
          phone: profile.phone ?? '',
          email: user!.email ?? '',
        }}
      />
      <p className="text-xs text-muted">
        A senha é gerenciada em{' '}
        <Link href="/conta/senha" className="font-bold text-brand hover:underline">
          Alterar senha
        </Link>
        . A troca de e-mail e a autenticação em duas etapas chegam na área de Segurança.
      </p>
    </div>
  );
}
