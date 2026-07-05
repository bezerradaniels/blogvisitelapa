'use client';

// Configurações do site: AdSense, comentários (informativo) e newsletter.
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import Button from '@/components/Button';
import Checkbox from '@/components/Checkbox';
import Select from '@/components/Select';
import { updateSetting } from '@/features/admin/settingsActions';

interface SettingsFormProps {
  adsenseEnabled: boolean;
  adsenseIntensity: string;
  newsletterEnabled: boolean;
}

export default function SettingsForm({ adsenseEnabled, adsenseIntensity, newsletterEnabled }: SettingsFormProps) {
  const router = useRouter();
  const [adsense, setAdsense] = useState(adsenseEnabled);
  const [intensity, setIntensity] = useState(adsenseIntensity);
  const [newsletter, setNewsletter] = useState(newsletterEnabled);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  function save() {
    setSaved(false);
    start(async () => {
      await updateSetting('adsense', { enabled: adsense, intensity });
      await updateSetting('newsletter', { enabled: newsletter });
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <div className="card-base space-y-4 p-4">
      <div className="space-y-2">
        <span className="text-sm font-bold text-title">Google AdSense</span>
        <Checkbox label="Ativar AdSense" checked={adsense} onChange={(e) => setAdsense(e.target.checked)} />
        <Select
          label="Intensidade"
          value={intensity}
          onChange={(e) => setIntensity(e.target.value)}
          options={[
            { value: 'conservadora', label: 'Conservadora' },
            { value: 'media', label: 'Média' },
            { value: 'agressiva', label: 'Agressiva' },
          ]}
        />
      </div>

      <div className="space-y-2 border-t border-line pt-4">
        <span className="text-sm font-bold text-title">Newsletter</span>
        <Checkbox label="Ativar captação de inscritos" checked={newsletter} onChange={(e) => setNewsletter(e.target.checked)} />
      </div>

      <div className="border-t border-line pt-4">
        <p className="mb-2 text-xs text-muted">
          Moderação de comentários: <strong>todos exigem aprovação</strong>. Publishers ativos:{' '}
          <strong>publicam direto</strong>.
        </p>
        {saved && <p className="mb-2 text-sm text-brand-dark">Configurações salvas.</p>}
        <Button onClick={save}>{pending ? 'Salvando...' : 'Salvar configurações'}</Button>
      </div>
    </div>
  );
}
