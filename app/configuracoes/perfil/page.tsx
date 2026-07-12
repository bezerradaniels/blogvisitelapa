import { SettingsHeader } from '@/components/SettingsSection';
import ProfilePrivacyForm from '@/features/settings/ProfilePrivacyForm';
import { getProfileSettings } from '@/features/settings/queries';
import { getCurrentUser } from '@/lib/auth/session';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({
  title: 'Perfil e privacidade',
  path: '/configuracoes/perfil',
  noindex: true,
});

export default async function PerfilConfigPage() {
  const user = await getCurrentUser();
  const profile = user!.profile!;
  const initial = await getProfileSettings(profile.id, {
    full_name: profile.full_name,
    bio: profile.bio,
    phone: profile.phone,
    avatar_url: profile.avatar_url,
  });

  return (
    <div className="space-y-5">
      <SettingsHeader
        title="Perfil e privacidade"
        description="Edite suas informações e escolha quem pode ver cada campo. A regra mais restritiva sempre vence: a visibilidade geral limita a de cada campo."
      />
      <ProfilePrivacyForm userId={profile.id} initial={initial} />
    </div>
  );
}
