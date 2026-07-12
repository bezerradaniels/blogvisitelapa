import { SettingsHeader } from '@/components/SettingsSection';
import InteractionsForm from '@/features/settings/InteractionsForm';
import { getPrivacyPrefs } from '@/features/settings/queries';
import { getCurrentUser } from '@/lib/auth/session';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({
  title: 'Interações',
  path: '/configuracoes/interacoes',
  noindex: true,
});

export default async function InteracoesPage() {
  const user = await getCurrentUser();
  const prefs = await getPrivacyPrefs(user!.profile!.id);

  return (
    <div className="space-y-5">
      <SettingsHeader
        title="Interações"
        description="Controle quem pode falar e interagir com você. As regras valem no servidor."
      />
      <InteractionsForm
        initial={{
          friend_request_permission: prefs.friend_request_permission,
          message_permission: prefs.message_permission,
        }}
      />
    </div>
  );
}
