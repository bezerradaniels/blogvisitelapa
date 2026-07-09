'use client';

// Edição do próprio perfil social (perguntas básicas + privacidade) + logout.
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Button from '@/components/Button';
import ImageUploader from '@/components/ImageUploader';
import Input from '@/components/Input';
import LogoutButton from '@/components/LogoutButton';
import Textarea from '@/components/Textarea';
import { saveProfile } from '@/features/social/actions';
import type { ProfileVisibility } from '@/types/database';

interface ProfileFormProps {
  userId: string;
  initial: {
    full_name: string;
    bio: string;
    phone: string;
    avatar_url: string | null;
    nickname: string;
    city: string;
    birth_date: string;
    relationship: string;
    interests: string;
    about: string;
    cover_url: string | null;
    visibility: ProfileVisibility;
  };
}

const VISIBILITY_OPTIONS: { value: ProfileVisibility; label: string; hint: string }[] = [
  { value: 'publico', label: 'Público', hint: 'Qualquer pessoa vê seu perfil completo.' },
  { value: 'amigos', label: 'Só amigos', hint: 'Apenas amigos veem seus dados, mural e depoimentos.' },
  { value: 'oculto', label: 'Oculto', hint: 'Ninguém além de você vê o conteúdo do perfil.' },
];

export default function ProfileForm({ userId, initial }: ProfileFormProps) {
  const router = useRouter();
  const [f, setF] = useState(initial);
  const [avatar, setAvatar] = useState<string | null>(initial.avatar_url);
  const [cover, setCover] = useState<string | null>(initial.cover_url);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof f>(key: K, value: (typeof f)[K]) {
    setF((prev) => ({ ...prev, [key]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setLoading(true);
    const res = await saveProfile({
      full_name: f.full_name,
      bio: f.bio,
      phone: f.phone,
      avatar_url: avatar ?? '',
      nickname: f.nickname,
      city: f.city,
      birth_date: f.birth_date,
      relationship: f.relationship,
      interests: f.interests,
      about: f.about,
      cover_url: cover ?? '',
      visibility: f.visibility,
    });
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? 'Não foi possível salvar.');
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <ImageUploader bucket="user-avatars" prefix={userId} value={avatar} onChange={setAvatar} label="Foto (avatar)" ratio="aspect-square" />
        <ImageUploader bucket="user-avatars" prefix={userId} value={cover} onChange={setCover} label="Capa do perfil" ratio="aspect-[16/9]" />
      </div>

      <Input label="Nome" value={f.full_name} onChange={(e) => set('full_name', e.target.value)} required />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Apelido" value={f.nickname} onChange={(e) => set('nickname', e.target.value)} />
        <Input label="Cidade" value={f.city} onChange={(e) => set('city', e.target.value)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Aniversário" type="date" value={f.birth_date} onChange={(e) => set('birth_date', e.target.value)} />
        <Input label="Relacionamento" value={f.relationship} onChange={(e) => set('relationship', e.target.value)} placeholder="Solteiro(a), casado(a)..." />
      </div>
      <Input label="Telefone" value={f.phone} onChange={(e) => set('phone', e.target.value)} />
      <Textarea label="Sobre mim" rows={3} value={f.about} onChange={(e) => set('about', e.target.value)} placeholder="Conte um pouco sobre você." />
      <Textarea label="Interesses" rows={2} value={f.interests} onChange={(e) => set('interests', e.target.value)} placeholder="Música, futebol, culinária..." />
      <Textarea label="Bio curta (aparece em autoria)" rows={2} value={f.bio} onChange={(e) => set('bio', e.target.value)} maxLength={500} />

      <div className="flex flex-col gap-1">
        <label htmlFor="visibility" className="text-xs font-medium text-body">
          Privacidade do perfil
        </label>
        <select
          id="visibility"
          value={f.visibility}
          onChange={(e) => set('visibility', e.target.value as ProfileVisibility)}
          className="h-10 w-full rounded border border-line bg-card px-3 text-sm outline-none focus:border-brand"
        >
          {VISIBILITY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span className="text-xs text-muted">
          {VISIBILITY_OPTIONS.find((o) => o.value === f.visibility)?.hint}
        </span>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      {saved && <p className="text-sm text-brand-dark">Perfil atualizado.</p>}

      <div className="flex items-center gap-2">
        <Button variant="primary" disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar'}
        </Button>
        <LogoutButton className="text-sm text-danger hover:underline" />
      </div>
    </form>
  );
}
