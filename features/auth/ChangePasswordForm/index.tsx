'use client';

// Troca de senha para usuário JÁ autenticado (dentro do ambiente logado).
// Segurança: exige a senha ATUAL e a revalida (signInWithPassword) antes de
// aplicar a nova. Isso impede que uma sessão aberta/roubada troque a senha
// sem conhecer a credencial atual.
import { useState } from 'react';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { notifyPasswordChanged } from '@/features/auth/actions';
import { createClient } from '@/lib/supabase/client';

interface ChangePasswordFormProps {
  email: string;
}

export default function ChangePasswordForm({ email }: ChangePasswordFormProps) {
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('A nova senha deve ter ao menos 8 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('A confirmação não coincide com a nova senha.');
      return;
    }
    if (password === current) {
      setError('A nova senha deve ser diferente da atual.');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    // 1) Revalida a senha atual. signInWithPassword falha se estiver errada.
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email,
      password: current,
    });
    if (reauthError) {
      setLoading(false);
      setError('Senha atual incorreta.');
      return;
    }

    // 2) Aplica a nova senha na sessão revalidada.
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError('Não foi possível alterar a senha. Tente novamente.');
      return;
    }

    // Aviso de segurança por e-mail (best-effort; não bloqueia o sucesso).
    void notifyPasswordChanged();

    setCurrent('');
    setPassword('');
    setConfirm('');
    setDone(true);
  }

  if (done) {
    return (
      <p className="card-base bg-brand-soft p-4 text-sm text-brand-dark">
        Senha alterada com sucesso. Ela já vale para os próximos acessos.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Input
        label="Senha atual"
        type={show ? 'text' : 'password'}
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
        autoComplete="current-password"
        required
      />

      <div className="relative">
        <Input
          label="Nova senha"
          type={show ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? 'Ocultar senhas' : 'Mostrar senhas'}
          className="absolute right-2 top-8 text-xs font-semibold text-brand hover:underline"
        >
          {show ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>

      <Input
        label="Confirmar nova senha"
        type={show ? 'text' : 'password'}
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        autoComplete="new-password"
        minLength={8}
        required
      />

      <p className="text-xs text-muted">Use ao menos 8 caracteres.</p>
      {error && <p className="text-sm text-danger">{error}</p>}

      <Button variant="primary" className="w-full">
        {loading ? 'Salvando…' : 'Alterar senha'}
      </Button>
    </form>
  );
}
