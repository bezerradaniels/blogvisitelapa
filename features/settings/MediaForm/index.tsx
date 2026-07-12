'use client';

// Privacidade de mídia: visibilidade padrão de novos álbuns. Fotos/álbuns
// existentes não mudam; a visibilidade é limitada pela do perfil (mais
// restritiva vence) e aplicada na RLS (can_view_album — 0027).
import { useState } from 'react';
import Button from '@/components/Button';
import PrivacySelector from '@/components/PrivacySelector';
import SettingsSection from '@/components/SettingsSection';
import { saveMediaPrefs } from '@/features/settings/actions';
import type { ProfileVisibility } from '@/types/database';

interface Props {
  initial: { default_album_visibility: ProfileVisibility };
}

export default function MediaForm({ initial }: Props) {
  const [vis, setVis] = useState<ProfileVisibility>(initial.default_album_visibility);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setLoading(true);
    const res = await saveMediaPrefs({ default_album_visibility: vis });
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? 'Não foi possível salvar.');
      return;
    }
    setSaved(true);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <SettingsSection
        title="Novos álbuns"
        description="Quem poderá ver os álbuns de fotos que você criar a partir de agora."
      >
        <PrivacySelector
          name="default-album-visibility"
          legend="Visibilidade padrão de novos álbuns"
          value={vis}
          onChange={(v) => {
            setVis(v);
            setSaved(false);
          }}
        />
        <p className="mt-2 text-xs text-muted">
          As fotos ficam em armazenamento privado e são servidas por links assinados: mesmo o
          arquivo direto respeita essa visibilidade. Álbuns já existentes não são alterados.
        </p>
      </SettingsSection>

      {error && <p className="text-sm text-danger">{error}</p>}
      {saved && <p className="text-sm text-brand-dark">Preferências salvas.</p>}

      <Button variant="primary" disabled={loading}>
        {loading ? 'Salvando…' : 'Salvar'}
      </Button>
    </form>
  );
}
