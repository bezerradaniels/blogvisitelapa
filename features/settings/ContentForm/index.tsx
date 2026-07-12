'use client';

// Preferências de conteúdo/feed: palavras silenciadas (aplicadas de verdade no
// feed) + autoplay de vídeos + ocultar conteúdo sensível.
import { useState } from 'react';
import Button from '@/components/Button';
import SettingsSection from '@/components/SettingsSection';
import Textarea from '@/components/Textarea';
import ToggleSwitch from '@/components/ToggleSwitch';
import { saveContentPrefs } from '@/features/settings/actions';
import type { ContentPrefs } from '@/features/settings/queries';

interface Props {
  initial: ContentPrefs;
}

// Aceita palavras separadas por vírgula ou quebra de linha.
function parseWords(text: string): string[] {
  return Array.from(
    new Set(
      text
        .split(/[\n,]/)
        .map((w) => w.toLowerCase().trim())
        .filter(Boolean),
    ),
  ).slice(0, 100);
}

export default function ContentForm({ initial }: Props) {
  const [wordsText, setWordsText] = useState(initial.muted_words.join(', '));
  const [autoplay, setAutoplay] = useState(initial.autoplay_videos);
  const [hideSensitive, setHideSensitive] = useState(initial.hide_sensitive);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const words = parseWords(wordsText);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setLoading(true);
    const res = await saveContentPrefs({
      muted_words: words,
      autoplay_videos: autoplay,
      hide_sensitive: hideSensitive,
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
      <SettingsSection
        title="Palavras silenciadas"
        description="Publicações do feed que contêm essas palavras ficam ocultas para você."
      >
        <Textarea
          label="Palavras (separadas por vírgula)"
          rows={3}
          value={wordsText}
          onChange={(e) => {
            setWordsText(e.target.value);
            setSaved(false);
          }}
          placeholder="ex.: spoiler, promoção, palavrão"
        />
        <p className="mt-1 text-xs text-muted">{words.length} palavra(s) · máximo 100.</p>
      </SettingsSection>

      <SettingsSection title="Exibição">
        <div className="divide-y divide-line">
          <ToggleSwitch
            label="Reproduzir vídeos automaticamente"
            description="Desative para economizar dados."
            checked={autoplay}
            onChange={(v) => {
              setAutoplay(v);
              setSaved(false);
            }}
          />
          <ToggleSwitch
            label="Ocultar conteúdo sensível"
            description="Esconde prévias de conteúdo marcado como sensível quando disponível."
            checked={hideSensitive}
            onChange={(v) => {
              setHideSensitive(v);
              setSaved(false);
            }}
          />
        </div>
      </SettingsSection>

      {error && <p className="text-sm text-danger">{error}</p>}
      {saved && <p className="text-sm text-brand-dark">Preferências salvas.</p>}

      <Button variant="primary" disabled={loading}>
        {loading ? 'Salvando…' : 'Salvar'}
      </Button>
    </form>
  );
}
