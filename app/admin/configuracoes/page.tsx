import SettingsForm from '@/features/admin/SettingsForm';
import AdminPageHeader from '@/components/AdminPageHeader';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type SettingValue = Record<string, unknown>;

export default async function AdminConfiguracoesPage() {
  const supabase = await createClient();
  const { data } = await supabase.from('settings').select('key, value');
  const map = new Map((data ?? []).map((s) => [s.key, s.value as SettingValue]));

  const adsense = map.get('adsense') ?? {};
  const newsletter = map.get('newsletter') ?? {};

  return (
    <div className="admin-page space-y-4">
      <AdminPageHeader title="Configurações" description="Preferências do portal armazenadas com segurança. Segredos permanecem nas variáveis de ambiente." />
      <SettingsForm
        adsenseEnabled={Boolean(adsense.enabled)}
        adsenseIntensity={String(adsense.intensity ?? 'conservadora')}
        newsletterEnabled={Boolean(newsletter.enabled)}
      />
    </div>
  );
}
