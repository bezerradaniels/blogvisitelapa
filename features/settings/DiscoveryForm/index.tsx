'use client';

// Descoberta: indexação por buscadores (noindex) e visibilidade em buscas
// internas. A indexação é reforçada no metadata de /u/[slug].
import { useState } from 'react';
import Button from '@/components/Button';
import Checkbox from '@/components/Checkbox';
import PrivacySelector from '@/components/PrivacySelector';
import SettingsSection from '@/components/SettingsSection';
import { saveDiscoverySettings } from '@/features/settings/actions';
import type { ProfileVisibility } from '@/types/database';

interface Props {
  initial: { allow_search_indexing: boolean; search_visibility: ProfileVisibility };
}

export default function DiscoveryForm({ initial }: Props) {
  const [indexing, setIndexing] = useState(initial.allow_search_indexing);
  const [searchVis, setSearchVis] = useState<ProfileVisibility>(initial.search_visibility);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setLoading(true);
    const res = await saveDiscoverySettings({
      allow_search_indexing: indexing,
      search_visibility: searchVis,
    });
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? 'Não foi possível salvar.');
      return;
    }
    setSaved(true);
  }

  return (
    <form onSubmit={onSubmit}>
      <SettingsSection title="Descoberta e buscadores">
        <div className="space-y-4">
          <div>
            <span className="mb-1 block text-xs font-semibold text-body">
              Quem pode me encontrar na busca do site
            </span>
            <PrivacySelector
              name="search-visibility"
              legend="Visibilidade na busca interna"
              value={searchVis}
              onChange={(v) => {
                setSearchVis(v);
                setSaved(false);
              }}
              size="sm"
            />
          </div>

          <div className="rounded-[10px] border border-line bg-surface p-3">
            <Checkbox
              label="Permitir indexação por buscadores"
              checked={indexing}
              onChange={(e) => {
                setIndexing(e.target.checked);
                setSaved(false);
              }}
            />
            <p className="mt-1 pl-7 text-xs text-muted">
              Quando desativado, seu perfil recebe <code>noindex</code> e não é exibido no
              Google. Perfis restritos nunca são indexados, independentemente disso.
            </p>
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-danger">{error}</p>}
        {saved && <p className="mt-3 text-sm text-brand-dark">Preferências salvas.</p>}

        <div className="mt-4">
          <Button variant="primary" disabled={loading}>
            {loading ? 'Salvando…' : 'Salvar'}
          </Button>
        </div>
      </SettingsSection>
    </form>
  );
}
