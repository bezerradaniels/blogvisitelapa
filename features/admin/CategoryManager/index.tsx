'use client';

// Gestão de categorias: formulário (criar/editar) + lista.
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import Checkbox from '@/components/Checkbox';
import Input from '@/components/Input';
import Select from '@/components/Select';
import Textarea from '@/components/Textarea';
import { deleteCategory, saveCategory, type CategoryInput } from '@/features/admin/taxonomyActions';

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: string;
  is_fixed_carousel_item: boolean;
  icon_name: string | null;
  sort_order: number;
  status: string;
}

const empty: CategoryInput = {
  name: '',
  slug: '',
  description: '',
  type: 'editorial',
  is_fixed_carousel_item: false,
  icon_name: '',
  sort_order: 0,
  status: 'active',
};

export default function CategoryManager({ categories }: { categories: CategoryRow[] }) {
  const router = useRouter();
  const [form, setForm] = useState<CategoryInput>(empty);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function edit(c: CategoryRow) {
    setForm({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description ?? '',
      type: c.type as CategoryInput['type'],
      is_fixed_carousel_item: c.is_fixed_carousel_item,
      icon_name: c.icon_name ?? '',
      sort_order: c.sort_order,
      status: c.status as CategoryInput['status'],
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function save() {
    setError(null);
    start(async () => {
      const res = await saveCategory(form);
      if (!res.ok) return setError(res.error ?? 'Erro ao salvar.');
      setForm(empty);
      router.refresh();
    });
  }

  function remove(id: string) {
    if (!confirm('Excluir esta categoria? Esta ação não poderá ser desfeita.')) return;
    setError(null);
    start(async () => {
      const res = await deleteCategory(id);
      if (!res.ok) return setError(res.error ?? 'Não foi possível excluir a categoria.');
      router.refresh();
    });
  }

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
      <div className="admin-form-panel space-y-3">
        <span className="admin-section-title">
          {form.id ? 'Editar categoria' : 'Adicionar nova categoria'}
        </span>
        <div className="grid gap-3">
          <Input label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Slug (opcional)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          <Select
            label="Tipo"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as CategoryInput['type'] })}
            options={[
              { value: 'editorial', label: 'Editorial' },
              { value: 'guia', label: 'Guia' },
              { value: 'institucional', label: 'Institucional' },
            ]}
          />
          <Input label="Ícone (Hugeicons)" value={form.icon_name} onChange={(e) => setForm({ ...form, icon_name: e.target.value })} placeholder="Ex.: News01Icon" />
          <Input label="Ordem" type="number" value={String(form.sort_order)} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as CategoryInput['status'] })}
            options={[
              { value: 'active', label: 'Ativa' },
              { value: 'suspended', label: 'Suspensa' },
            ]}
          />
        </div>
        <Textarea label="Descrição" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <Checkbox label="Item do carrossel fixo da home" checked={form.is_fixed_carousel_item} onChange={(e) => setForm({ ...form, is_fixed_carousel_item: e.target.checked })} />
        {error && <p role="alert" className="admin-notice admin-notice-danger text-sm text-danger">{error}</p>}
        <div className="flex gap-2">
          <Button onClick={save}>{pending ? 'Salvando...' : form.id ? 'Salvar alterações' : 'Criar categoria'}</Button>
          {form.id && <Button variant="ghost" onClick={() => setForm(empty)}>Cancelar</Button>}
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th className="p-3">Nome</th>
              <th className="p-3">Tipo</th>
              <th className="p-3">Carrossel</th>
              <th className="p-3">Ordem</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {categories.map((c) => (
              <tr key={c.id}>
                <td className="p-3">
                  <span className="font-medium text-title">{c.name}</span>
                  <span className="block text-xs text-muted">/{c.slug}</span>
                </td>
                <td className="p-3 text-muted">{c.type}</td>
                <td className="p-3">{c.is_fixed_carousel_item ? <Badge tone="brand">Sim</Badge> : '—'}</td>
                <td className="p-3 text-muted">{c.sort_order}</td>
                <td>
                  <div className="admin-row-actions !visible">
                    <button onClick={() => edit(c)} className="admin-row-action">Editar</button>
                    <button onClick={() => remove(c.id)} className="admin-row-action admin-row-action-danger">Excluir</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
