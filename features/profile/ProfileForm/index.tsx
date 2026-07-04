'use client';

// Edição do próprio perfil + logout.
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Textarea from '@/components/Textarea';
import { createClient } from '@/lib/supabase/client';

interface ProfileFormProps {
  profileId: string;
  initialName: string;
  initialBio: string;
  initialPhone: string;
}

export default function ProfileForm({ profileId, initialName, initialBio, initialPhone }: ProfileFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [bio, setBio] = useState(initialBio);
  const [phone, setPhone] = useState(initialPhone);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    const supabase = createClient();
    await supabase.from('profiles').update({ full_name: name, bio, phone }).eq('id', profileId);
    setLoading(false);
    setSaved(true);
    router.refresh();
  }

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <form onSubmit={save} className="space-y-3">
      <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} />
      <Input label="Telefone" value={phone} onChange={(e) => setPhone(e.target.value)} />
      <Textarea label="Bio" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
      {saved && <p className="text-sm text-brand-dark">Perfil atualizado.</p>}
      <div className="flex items-center gap-2">
        <Button variant="primary">{loading ? 'Salvando...' : 'Salvar'}</Button>
        <button type="button" onClick={logout} className="text-sm text-danger hover:underline">
          Sair da conta
        </button>
      </div>
    </form>
  );
}
