'use client';

// Criação/edição de comunidade. Usa server actions createCommunity/updateCommunity.
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Button from '@/components/Button';
import ImageUploader from '@/components/ImageUploader';
import Input from '@/components/Input';
import Textarea from '@/components/Textarea';
import { createCommunity, updateCommunity } from '@/features/communities/actions';
import { COMMUNITY_CATEGORIES } from '@/lib/config/communities';
import type { CommunityCategory } from '@/types/database';

interface CommunityFormProps {
  userId: string; // auth uid — pasta do bucket de avatares
  redirectTo?: string;
  cancelHref?: string;
  community?: {
    id: string;
    name: string;
    category: CommunityCategory;
    description: string | null;
    rules: string | null;
    avatar_url: string | null;
    cover_image_url: string | null;
  };
}

export default function CommunityForm({
  userId,
  community,
  redirectTo,
  cancelHref = '/comunidades',
}: CommunityFormProps) {
  const router = useRouter();
  const editing = Boolean(community);

  const [name, setName] = useState(community?.name ?? '');
  const [category, setCategory] = useState<CommunityCategory>(community?.category ?? 'outros');
  const [description, setDescription] = useState(community?.description ?? '');
  const [rules, setRules] = useState(community?.rules ?? '');
  const [avatar, setAvatar] = useState<string | null>(community?.avatar_url ?? null);
  const [cover, setCover] = useState<string | null>(community?.cover_image_url ?? null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const payload = {
      name,
      category,
      description,
      rules,
      avatar_url: avatar ?? '',
      cover_image_url: cover ?? '',
    };
    const res = editing
      ? await updateCommunity(community!.id, payload)
      : await createCommunity(payload);
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? 'Algo deu errado.');
      return;
    }
    router.push(redirectTo ?? `/comunidades/${res.slug}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Input
        label="Nome da comunidade"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={120}
        required
      />

      <div className="flex flex-col gap-1">
        <label htmlFor="category" className="text-xs font-medium text-body">
          Categoria
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value as CommunityCategory)}
          className="h-10 w-full rounded border border-line bg-card px-3 text-sm outline-none focus:border-brand"
        >
          {COMMUNITY_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <Textarea
        label="Descrição"
        rows={3}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={2000}
        placeholder="Sobre o que é esta comunidade?"
      />

      <Textarea
        label="Regras (opcional)"
        rows={3}
        value={rules}
        onChange={(e) => setRules(e.target.value)}
        maxLength={4000}
        placeholder="Combinados de convivência da comunidade."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <ImageUploader
          bucket="user-avatars"
          prefix={userId}
          value={avatar}
          onChange={setAvatar}
          label="Ícone da comunidade"
          ratio="aspect-square"
        />
        <ImageUploader
          bucket="user-avatars"
          prefix={userId}
          value={cover}
          onChange={setCover}
          label="Capa (opcional)"
          ratio="aspect-[16/9]"
        />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex items-center gap-2">
        <Button variant="primary" disabled={loading}>
          {loading ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar comunidade'}
        </Button>
        <Button href={cancelHref} variant="ghost" size="sm">
          Cancelar
        </Button>
      </div>
    </form>
  );
}
