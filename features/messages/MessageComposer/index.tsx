'use client';

// Caixa de envio de mensagem em uma conversa.
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Button from '@/components/Button';
import { sendMessage } from '@/features/messages/actions';

export default function MessageComposer({ conversationId }: { conversationId: string }) {
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
    const res = await sendMessage(conversationId, { content: text });
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? 'Não foi possível enviar.');
      return;
    }
    setContent('');
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex items-end gap-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={2}
        maxLength={4000}
        placeholder="Escreva uma mensagem..."
        className="min-w-0 flex-1 rounded border border-line bg-card p-3 text-sm outline-none focus:border-brand"
      />
      <Button size="sm" variant="primary" disabled={loading}>
        {loading ? '...' : 'Enviar'}
      </Button>
      {error && <span className="text-xs text-danger">{error}</span>}
    </form>
  );
}
