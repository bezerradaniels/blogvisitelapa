'use client';

// Sessões e dispositivos. O client do Supabase não expõe a lista completa de
// sessões por dispositivo (isso exige a Admin API), mas permite encerrar as
// demais sessões ou todas — o essencial para recuperar uma conta comprometida.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import { createClient } from '@/lib/supabase/client';

export default function SessionsManager() {
  const router = useRouter();
  const [busy, setBusy] = useState<'others' | 'global' | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signOutOthers() {
    setError(null);
    setMsg(null);
    setBusy('others');
    const supabase = createClient();
    const { error: err } = await supabase.auth.signOut({ scope: 'others' });
    setBusy(null);
    if (err) {
      setError('Não foi possível encerrar as outras sessões.');
      return;
    }
    setMsg('Outras sessões foram encerradas.');
  }

  async function signOutGlobal() {
    setError(null);
    setBusy('global');
    const supabase = createClient();
    await supabase.auth.signOut({ scope: 'global' });
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        Se você acha que sua conta foi acessada em outro lugar, encerre as demais sessões. A lista
        detalhada de dispositivos ainda não está disponível.
      </p>
      {error && <p className="text-sm text-danger">{error}</p>}
      {msg && <p className="text-sm text-brand-dark">{msg}</p>}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={signOutOthers} disabled={busy !== null}>
          {busy === 'others' ? 'Encerrando…' : 'Encerrar outras sessões'}
        </Button>
        <Button variant="danger" size="sm" onClick={signOutGlobal} disabled={busy !== null}>
          {busy === 'global' ? 'Saindo…' : 'Sair de todos os dispositivos'}
        </Button>
      </div>
    </div>
  );
}
