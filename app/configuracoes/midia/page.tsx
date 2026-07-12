import { SettingsHeader } from '@/components/SettingsSection';
import MediaForm from '@/features/settings/MediaForm';
import { getContentPrefs } from '@/features/settings/queries';
import { getCurrentUser } from '@/lib/auth/session';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({
  title: 'Mídia',
  path: '/configuracoes/midia',
  noindex: true,
});

export default async function MidiaPage() {
  const user = await getCurrentUser();
  const prefs = await getContentPrefs(user!.profile!.id);

  return (
    <div className="space-y-5">
      <SettingsHeader
        title="Mídia"
        description="Controle a privacidade padrão das suas fotos e álbuns."
      />
      <MediaForm initial={{ default_album_visibility: prefs.default_album_visibility }} />
    </div>
  );
}
