'use client';

// Preferências de notificação por categoria (in-app) + master de e-mail.
// As categorias in-app são aplicadas de verdade em push_notification (0026).
import { useState } from 'react';
import Button from '@/components/Button';
import SettingsSection from '@/components/SettingsSection';
import ToggleSwitch from '@/components/ToggleSwitch';
import { saveNotificationPrefs } from '@/features/settings/actions';
import type { NotificationPrefs } from '@/features/settings/queries';

interface Props {
  initial: NotificationPrefs;
}

const INAPP: { key: keyof NotificationPrefs; label: string; description: string }[] = [
  { key: 'inapp_amizade', label: 'Amizades', description: 'Pedidos de amizade e quando aceitam você.' },
  { key: 'inapp_recado', label: 'Recados', description: 'Novos recados no seu mural.' },
  { key: 'inapp_depoimento', label: 'Depoimentos', description: 'Depoimentos que você recebe.' },
  { key: 'inapp_mensagem', label: 'Mensagens', description: 'Novas mensagens privadas.' },
];

export default function NotificationsForm({ initial }: Props) {
  const [f, setF] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function set(key: keyof NotificationPrefs, value: boolean) {
    setF((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setLoading(true);
    const res = await saveNotificationPrefs({
      inapp_amizade: f.inapp_amizade,
      inapp_recado: f.inapp_recado,
      inapp_depoimento: f.inapp_depoimento,
      inapp_mensagem: f.inapp_mensagem,
      email_enabled: f.email_enabled,
    });
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? 'Não foi possível salvar.');
      return;
    }
    setSaved(true);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <SettingsSection title="No site (in-app)" description="O que aparece no sino de notificações.">
        <div className="divide-y divide-line">
          {INAPP.map((item) => (
            <ToggleSwitch
              key={item.key}
              label={item.label}
              description={item.description}
              checked={Boolean(f[item.key])}
              onChange={(v) => set(item.key, v)}
            />
          ))}
        </div>
      </SettingsSection>

      <SettingsSection title="E-mail">
        <ToggleSwitch
          label="E-mails de notificação"
          description="Preferência guardada para quando os e-mails de notificação por evento forem ativados. Avisos de segurança da conta sempre são enviados."
          checked={f.email_enabled}
          onChange={(v) => set('email_enabled', v)}
        />
      </SettingsSection>

      {error && <p className="text-sm text-danger">{error}</p>}
      {saved && <p className="text-sm text-brand-dark">Preferências salvas.</p>}

      <Button variant="primary" disabled={loading}>
        {loading ? 'Salvando…' : 'Salvar'}
      </Button>
    </form>
  );
}
