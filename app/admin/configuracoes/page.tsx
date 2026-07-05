import SettingsForm from '@/features/admin/SettingsForm';
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
    <div className="space-y-4">
      <h2 className="text-base font-bold text-title">Configurações</h2>
      <SettingsForm
        adsenseEnabled={Boolean(adsense.enabled)}
        adsenseIntensity={String(adsense.intensity ?? 'conservadora')}
        newsletterEnabled={Boolean(newsletter.enabled)}
      />
    </div>
  );
}
