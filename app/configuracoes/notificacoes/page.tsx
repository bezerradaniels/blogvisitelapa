import { SettingsHeader } from '@/components/SettingsSection';
import NotificationsForm from '@/features/settings/NotificationsForm';
import { getNotificationPrefs } from '@/features/settings/queries';
import { getCurrentUser } from '@/lib/auth/session';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({
  title: 'Notificações',
  path: '/configuracoes/notificacoes',
  noindex: true,
});

export default async function NotificacoesPage() {
  const user = await getCurrentUser();
  const prefs = await getNotificationPrefs(user!.profile!.id);

  return (
    <div className="space-y-5">
      <SettingsHeader
        title="Notificações"
        description="Escolha sobre o que você quer ser avisado."
      />
      <NotificationsForm initial={prefs} />
    </div>
  );
}
