import { SettingsHeader } from '@/components/SettingsSection';
import ContentForm from '@/features/settings/ContentForm';
import { getContentPrefs } from '@/features/settings/queries';
import { getCurrentUser } from '@/lib/auth/session';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({
  title: 'Conteúdo e feed',
  path: '/configuracoes/conteudo',
  noindex: true,
});

export default async function ConteudoPage() {
  const user = await getCurrentUser();
  const prefs = await getContentPrefs(user!.profile!.id);

  return (
    <div className="space-y-5">
      <SettingsHeader
        title="Conteúdo e feed"
        description="Silencie palavras e ajuste como o conteúdo aparece para você."
      />
      <ContentForm initial={prefs} />
    </div>
  );
}
