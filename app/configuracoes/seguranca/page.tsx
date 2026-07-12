import SettingsSection, { SettingsHeader } from '@/components/SettingsSection';
import ChangePasswordForm from '@/features/auth/ChangePasswordForm';
import SessionsManager from '@/features/settings/SessionsManager';
import TwoFactorManager from '@/features/settings/TwoFactorManager';
import { getCurrentUser } from '@/lib/auth/session';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({
  title: 'Segurança',
  path: '/configuracoes/seguranca',
  noindex: true,
});

export default async function SegurancaPage() {
  const user = await getCurrentUser();
  const email = user!.email ?? '';

  return (
    <div className="space-y-5">
      <SettingsHeader
        title="Segurança"
        description="Senha, verificação em duas etapas e sessões da sua conta."
      />

      <SettingsSection title="Senha" description="Exige a senha atual para confirmar a troca.">
        <ChangePasswordForm email={email} />
      </SettingsSection>

      <SettingsSection title="Verificação em duas etapas (2FA)">
        <TwoFactorManager />
      </SettingsSection>

      <SettingsSection title="Sessões e dispositivos">
        <SessionsManager />
      </SettingsSection>
    </div>
  );
}
