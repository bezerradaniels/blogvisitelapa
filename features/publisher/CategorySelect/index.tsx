'use client';

// Seleção de categoria e subcategoria com criação inline (modal discreto),
// sem sair do editor de post. O post guarda category_id = subcategoria quando
// escolhida, senão a categoria principal. Renderizado em dois cards separados
// (CategoryPicker + SubcategoryPicker) que compartilham o mesmo estado.
import { useState, useTransition } from 'react';
import Button from '@/components/Button';
import Icon from '@/components/Icon';
import Input from '@/components/Input';
import Select from '@/components/Select';
import { createCategoryInline } from '@/features/publisher/actions';

export interface CategoryOption {
  id: string;
  name: string;
  slug?: string | null;
  parent_id?: string | null;
}

interface SharedProps {
  categories: CategoryOption[];
  categoryId: string;
  onChange: (id: string) => void;
  onCreated: (c: CategoryOption) => void;
}

function AddButton({ onClick, title }: { onClick: () => void; title: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="mb-[1px] flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-line bg-card text-brand transition-colors hover:border-brand hover:bg-brand-soft"
    >
      <Icon icon="PlusSignIcon" size={18} />
    </button>
  );
}

// Deriva a categoria principal a partir da seleção atual (que pode ser uma sub).
function useDerived(categories: CategoryOption[], categoryId: string) {
  const topLevel = categories.filter((c) => !c.parent_id);
  const selected = categories.find((c) => c.id === categoryId) ?? null;
  const topId = selected ? (selected.parent_id ?? selected.id) : '';
  const subs = categories.filter((c) => c.parent_id === topId);
  const subValue = selected && selected.parent_id ? selected.id : '';
  const topName = topLevel.find((c) => c.id === topId)?.name;
  return { topLevel, topId, subs, subValue, topName };
}

export function CategoryPicker({ categories, categoryId, onChange, onCreated }: SharedProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const { topLevel, topId } = useDerived(categories, categoryId);

  return (
    <div className="flex items-end gap-1">
      <div className="flex-1">
        <Select
          label="Categoria"
          value={topId}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Selecione..."
          options={topLevel.map((c) => ({ value: c.id, label: c.name }))}
        />
      </div>
      <AddButton title="Nova categoria" onClick={() => setModalOpen(true)} />
      {modalOpen && (
        <CategoryModal
          parentId=""
          onClose={() => setModalOpen(false)}
          onCreated={(c) => {
            onCreated(c);
            setModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

export function SubcategoryPicker({ categories, categoryId, onChange, onCreated }: SharedProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const { topId, subs, subValue, topName } = useDerived(categories, categoryId);

  if (!topId) {
    return (
      <p className="text-xs text-muted">
        Selecione uma categoria para escolher ou criar uma subcategoria.
      </p>
    );
  }

  return (
    <div className="flex items-end gap-1">
      <div className="flex-1">
        <Select
          label={`Subcategoria de ${topName ?? ''}`.trim()}
          value={subValue}
          onChange={(e) => onChange(e.target.value || topId)}
          placeholder="Nenhuma"
          options={subs.map((c) => ({ value: c.id, label: c.name }))}
        />
      </div>
      <AddButton title="Nova subcategoria" onClick={() => setModalOpen(true)} />
      {modalOpen && (
        <CategoryModal
          parentId={topId}
          parentName={topName}
          onClose={() => setModalOpen(false)}
          onCreated={(c) => {
            onCreated(c);
            setModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

function CategoryModal({
  parentId,
  parentName,
  onClose,
  onCreated,
}: {
  parentId: string;
  parentName?: string;
  onClose: () => void;
  onCreated: (c: CategoryOption) => void;
}) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const isSub = Boolean(parentId);

  function submit() {
    setError(null);
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError('Informe um nome com pelo menos 2 caracteres.');
      return;
    }
    start(async () => {
      const res = await createCategoryInline({ name: trimmed, parentId: parentId || '' });
      if (!res.ok || !res.category) {
        setError(res.error ?? 'Não foi possível criar.');
        return;
      }
      onCreated(res.category);
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={onClose}
    >
      <div className="card-base w-full max-w-sm space-y-3 p-4" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-title">
            {isSub ? 'Nova subcategoria' : 'Nova categoria'}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-surface"
          >
            <Icon icon="Cancel01Icon" size={16} />
          </button>
        </div>

        {isSub && parentName && (
          <p className="text-xs text-muted">
            Dentro de <strong className="text-body">{parentName}</strong>.
          </p>
        )}

        <Input
          label="Nome"
          value={name}
          autoFocus
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={isSub ? 'Ex.: Ensino de idiomas' : 'Ex.: Educação'}
        />
        {error && <p className="text-xs text-danger">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" onClick={submit}>
            {pending ? 'Criando...' : 'Criar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
