'use client';

// Escrever/atualizar um depoimento (só amigos). Entra como pendente até o dono
// aprovar.
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Button from '@/components/Button';
import { postTestimonial } from '@/features/social/actions';

interface TestimonialFormProps {
  profileId: string;
  initialContent?: string;
}

export default function TestimonialForm({ profileId, initialContent = '' }: TestimonialFormProps) {
  const router = useRouter();
  const [content, setContent] = useState(initialContent);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const text = content.trim();
    if (!text) return;
    setLoading(true);
    const res = await postTestimonial(profileId, { content: text });
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? 'Não foi possível enviar.');
      return;
    }
    setSent(true);
    router.refresh();
  }

  if (sent) {
    return (
      <p className="card-base bg-brand-soft p-3 text-sm text-brand-dark">
        Depoimento enviado! Ele aparece após aprovação da pessoa.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder="Escreva um depoimento sobre esta pessoa..."
        className="w-full rounded border border-line bg-card p-3 text-sm outline-none focus:border-brand"
      />
      {error && <p className="text-xs text-danger">{error}</p>}
      <Button size="sm" variant="primary" disabled={loading}>
        {loading ? 'Enviando...' : 'Enviar depoimento'}
      </Button>
    </form>
  );
}
