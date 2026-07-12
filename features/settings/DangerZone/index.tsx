'use client';

// Zona de risco: desativar (reversível) e excluir (carência de 30 dias).
// Ambas exigem reautenticação com a senha atual (autenticação recente). A
// exclusão exige ainda digitar EXCLUIR. Após a ação, encerra a sessão.
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Button from '@/components/Button';
import Icon from '@/components/Icon';
import Input from '@/components/Input';
import Textarea from '@/components/Textarea';
import { deactivateAccount, requestAccountDeletion } from '@/features/settings/account';
import { createClient } from '@/lib/supabase/client';

const CONFIRM_WORD = 'EXCLUIR';

export default function DangerZone({ email }: { email: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<null | 'deactivate' | 'delete'>(null);
  const [password, setPassword] = useState('');
  const [reason, setReason] = useState('');
  const [confirmWord, setConfirmWord] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reauth(): Promise<boolean> {
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError('Senha incorreta.');
      return false;
    }
    return true;
  }

  async function runDeactivate() {
    setError(null);
    setLoading(true);
    if (!(await reauth())) {
      setLoading(false);
      return;
    }
    const res = await deactivateAccount();
    if (!res.ok) {
      setLoading(false);
      setError(res.error ?? 'Não foi possível desativar.');
      return;
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  async function runDelete() {
    setError(null);
    if (confirmWord.trim().toUpperCase() !== CONFIRM_WORD) {
      setError(`Digite ${CONFIRM_WORD} para confirmar.`);
      return;
    }
    setLoading(true);
    if (!(await reauth())) {
      setLoading(false);
      return;
    }
    const res = await requestAccountDeletion(reason);
    if (!res.ok) {
      setLoading(false);
      setError(res.error ?? 'Não foi possível solicitar a exclusão.');
      return;
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {/* Desativar */}
      <div className="card-base p-4 sm:p-5">
        <h2 className="text-base font-extrabold text-title">Desativar conta</h2>
        <p className="mt-1 text-sm text-muted">
          Seu perfil fica oculto e você não aparece para outras pessoas. Nada é apagado — basta
          entrar de novo para reativar quando quiser.
        </p>
        {mode === 'deactivate' ? (
          <div className="mt-4 space-y-3">
            <Input
              label="Confirme sua senha"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <p className="text-sm text-danger">{error}</p>}
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={runDeactivate} disabled={loading || !password}>
                {loading ? 'Desativando…' : 'Confirmar desativação'}
              </Button>
              <button type="button" onClick={() => { setMode(null); setError(null); }} className="text-sm font-bold text-muted hover:text-body">
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <Button variant="outline" size="sm" className="mt-4" onClick={() => { setMode('deactivate'); setError(null); }}>
            Desativar minha conta
          </Button>
        )}
      </div>

      {/* Excluir */}
      <div className="rounded-lg border border-danger/40 bg-danger/5 p-4 sm:p-5">
        <h2 className="flex items-center gap-2 text-base font-extrabold text-danger">
          <Icon icon="SquareLock02Icon" size={18} />
          Excluir conta
        </h2>
        <p className="mt-1 text-sm text-body">
          A exclusão é <strong>permanente</strong> e apaga seu perfil, publicações, fotos, amizades
          e mensagens. Você tem <strong>30 dias</strong> para cancelar entrando de novo; depois
          disso, os dados são removidos de forma definitiva. Baixe seus dados antes, se quiser.
        </p>
        {mode === 'delete' ? (
          <div className="mt-4 space-y-3">
            <Textarea
              label="Motivo (opcional)"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Conte por que está saindo (opcional)."
            />
            <Input
              label="Confirme sua senha"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Input
              label={`Digite ${CONFIRM_WORD} para confirmar`}
              value={confirmWord}
              onChange={(e) => setConfirmWord(e.target.value)}
              placeholder={CONFIRM_WORD}
            />
            {error && <p className="text-sm text-danger">{error}</p>}
            <div className="flex items-center gap-2">
              <Button variant="danger" size="sm" onClick={runDelete} disabled={loading || !password}>
                {loading ? 'Enviando…' : 'Excluir minha conta'}
              </Button>
              <button type="button" onClick={() => { setMode(null); setError(null); }} className="text-sm font-bold text-muted hover:text-body">
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <Button variant="danger" size="sm" className="mt-4" onClick={() => { setMode('delete'); setError(null); }}>
            Excluir minha conta
          </Button>
        )}
      </div>
    </div>
  );
}
