'use client';

// Cria um novo álbum de fotos.
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { createAlbum } from '@/features/photos/actions';

export default function AlbumForm({ slug }: { slug: string }) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await createAlbum({ title });
    setLoading(false);
    if (!res.ok || !res.id) {
      setError(res.error ?? 'Não foi possível criar.');
      return;
    }
    setTitle('');
    router.push(`/u/${slug}/fotos/${res.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex items-end gap-2">
      <div className="flex-1">
        <Input label="Novo álbum" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nome do álbum" />
      </div>
      <Button size="sm" variant="primary" disabled={loading}>
        {loading ? '...' : 'Criar'}
      </Button>
      {error && <span className="text-xs text-danger">{error}</span>}
    </form>
  );
}
