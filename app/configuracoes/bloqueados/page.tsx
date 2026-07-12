import { SettingsHeader } from '@/components/SettingsSection';
import BlockedUsersList from '@/features/settings/BlockedUsersList';
import { listBlockedUsers } from '@/features/settings/queries';
import { getCurrentUser } from '@/lib/auth/session';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({
  title: 'Bloqueados',
  path: '/configuracoes/bloqueados',
  noindex: true,
});

export default async function BloqueadosPage() {
  const user = await getCurrentUser();
  const blocked = await listBlockedUsers(user!.profile!.id);

  return (
    <div className="space-y-5">
      <SettingsHeader
        title="Bloqueados"
        description="Pessoas bloqueadas não veem seu perfil nem interagem com você."
      />
      <BlockedUsersList initial={blocked} />
    </div>
  );
}
