'use client';

// Gestão de tags: adicionar e excluir.
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { deleteTag, saveTag } from '@/features/admin/taxonomyActions';

interface TagRow {
  id: string;
  name: string;
  slug: string;
}

export default function TagManager({ tags }: { tags: TagRow[] }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function add() {
    setError(null);
    start(async () => {
      const res = await saveTag({ name });
      if (!res.ok) return setError(res.error ?? 'Erro.');
      setName('');
      router.refresh();
    });
  }

  function remove(id: string) {
    start(async () => {
      await deleteTag(id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="card-base flex items-end gap-2 p-4">
        <div className="flex-1">
          <Input label="Nova tag" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: romaria" />
        </div>
        <Button onClick={add}>{pending ? '...' : 'Adicionar'}</Button>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {tags.length === 0 && <p className="text-sm text-muted">Nenhuma tag ainda.</p>}
        {tags.map((t) => (
          <span key={t.id} className="flex items-center gap-2 rounded border border-line bg-card px-2 py-1 text-sm">
            {t.name}
            <button onClick={() => remove(t.id)} className="text-danger hover:underline" aria-label={`Excluir ${t.name}`}>
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
