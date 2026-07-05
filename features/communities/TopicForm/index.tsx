'use client';

// Novo tópico dentro de uma comunidade (texto puro).
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Textarea from '@/components/Textarea';
import { createTopic } from '@/features/communities/actions';

interface TopicFormProps {
  communityId: string;
  communitySlug: string;
}

export default function TopicForm({ communityId, communitySlug }: TopicFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await createTopic(communityId, { title, content });
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? 'Não foi possível criar o tópico.');
      return;
    }
    router.push(`/comunidades/${communitySlug}/topicos/${res.slug}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Input
        label="Título do tópico"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={200}
        required
      />
      <Textarea
        label="Mensagem"
        rows={6}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={10000}
        placeholder="Comece a conversa..."
        required
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex items-center gap-2">
        <Button variant="primary" disabled={loading}>
          {loading ? 'Publicando...' : 'Publicar tópico'}
        </Button>
        <Button href={`/comunidades/${communitySlug}`} variant="ghost" size="sm">
          Cancelar
        </Button>
      </div>
    </form>
  );
}
