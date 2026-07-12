import { SettingsHeader } from '@/components/SettingsSection';
import DangerZone from '@/features/settings/DangerZone';
import { getCurrentUser } from '@/lib/auth/session';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({
  title: 'Status da conta',
  path: '/configuracoes/conta-status',
  noindex: true,
});

export default async function ContaStatusPage() {
  const user = await getCurrentUser();

  return (
    <div className="space-y-5">
      <SettingsHeader
        title="Status da conta"
        description="Desative temporariamente ou exclua sua conta."
      />
      <DangerZone email={user!.email ?? ''} />
    </div>
  );
}
