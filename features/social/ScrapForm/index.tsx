'use client';

// Deixar um recado no mural (só amigos — validado na action/RLS).
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Button from '@/components/Button';
import { postScrap } from '@/features/social/actions';

export default function ScrapForm({ profileId }: { profileId: string }) {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const text = content.trim();
    if (!text) return;
    setLoading(true);
    const res = await postScrap(profileId, { content: text });
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? 'Não foi possível enviar.');
      return;
    }
    setContent('');
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={2}
        maxLength={1000}
        placeholder="Deixe um recado..."
        className="w-full rounded border border-line bg-card p-3 text-sm outline-none focus:border-brand"
      />
      {error && <p className="text-xs text-danger">{error}</p>}
      <Button size="sm" variant="primary" disabled={loading}>
        {loading ? 'Enviando...' : 'Deixar recado'}
      </Button>
    </form>
  );
}
