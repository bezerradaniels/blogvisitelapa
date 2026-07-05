'use client';

// Caixa de resposta em um tópico. Bloqueada se o tópico estiver travado ou se
// o usuário não for membro.
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Button from '@/components/Button';
import { createReply } from '@/features/communities/actions';

interface ReplyBoxProps {
  topicId: string;
  canReply: boolean;
  isLogged: boolean;
  isMember: boolean;
  isLocked: boolean;
  communitySlug: string;
}

export default function ReplyBox({
  topicId,
  canReply,
  isLogged,
  isMember,
  isLocked,
  communitySlug,
}: ReplyBoxProps) {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (isLocked) {
    return <p className="card-base p-3 text-sm text-muted">Este tópico está fechado para novas respostas.</p>;
  }
  if (!isLogged) {
    return (
      <p className="text-sm text-muted">
        <Link href={`/login?redirect=/comunidades/${communitySlug}`} className="text-brand underline">
          Entre
        </Link>{' '}
        para responder.
      </p>
    );
  }
  if (!isMember || !canReply) {
    return <p className="text-sm text-muted">Participe da comunidade para responder.</p>;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const text = content.trim();
    if (text.length < 1) {
      setError('Escreva uma resposta.');
      return;
    }
    setLoading(true);
    const res = await createReply(topicId, { content: text });
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? 'Não foi possível responder.');
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
        rows={3}
        maxLength={10000}
        placeholder="Escreva sua resposta..."
        className="w-full rounded border border-line bg-card p-3 text-sm outline-none focus:border-brand"
      />
      {error && <p className="text-xs text-danger">{error}</p>}
      <Button size="sm" variant="primary" disabled={loading}>
        {loading ? 'Enviando...' : 'Responder'}
      </Button>
    </form>
  );
}
