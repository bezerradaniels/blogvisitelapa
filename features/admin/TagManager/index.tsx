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
  const [editing, setEditing] = useState<TagRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function add() {
    setError(null);
    start(async () => {
      const res = await saveTag({ id: editing?.id, name });
      if (!res.ok) return setError(res.error ?? 'Erro.');
      setName('');
      setEditing(null);
      router.refresh();
    });
  }

  function remove(id: string) {
    if (!confirm('Excluir esta tag? Esta ação não poderá ser desfeita.')) return;
    setError(null);
    start(async () => {
      const res = await deleteTag(id);
      if (!res.ok) return setError(res.error ?? 'Não foi possível excluir a tag.');
      router.refresh();
    });
  }

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
      <div className="admin-form-panel space-y-3">
        <div>
          <h2 className="admin-section-title">{editing ? 'Editar tag' : 'Adicionar nova tag'}</h2>
          <p className="admin-help mt-1">Tags ajudam a relacionar conteúdos sem criar hierarquia.</p>
        </div>
        <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: romaria" />
        <div className="flex gap-2"><Button onClick={add}>{pending ? 'Salvando…' : editing ? 'Salvar alterações' : 'Adicionar tag'}</Button>{editing && <Button variant="ghost" onClick={() => { setEditing(null); setName(''); }}>Cancelar</Button>}</div>
        {error && <p role="alert" className="admin-notice admin-notice-danger text-sm text-danger">{error}</p>}
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Nome</th><th>Slug</th><th>Ações</th></tr></thead>
          <tbody>
            {tags.length === 0 && <tr><td colSpan={3}>Nenhuma tag cadastrada.</td></tr>}
            {tags.map((tag) => <tr key={tag.id}><td><strong>{tag.name}</strong></td><td>{tag.slug}</td><td><div className="admin-row-actions !visible"><button className="admin-row-action" onClick={() => { setEditing(tag); setName(tag.name); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Editar</button><button className="admin-row-action admin-row-action-danger" onClick={() => remove(tag.id)}>Excluir</button></div></td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
