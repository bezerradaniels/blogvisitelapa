'use client';

// Define a nova senha. O usuário chega aqui autenticado pelo link de
// recuperação (a sessão foi criada no /auth/callback).
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [ready, setReady] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Confirma que há sessão (link válido). Sem sessão, o link expirou/é inválido.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setReady(Boolean(data.user)));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('A senha deve ter ao menos 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (err) {
      setError('Não foi possível redefinir a senha. Solicite um novo link.');
      return;
    }
    setDone(true);
    setTimeout(() => {
      router.push('/perfil');
      router.refresh();
    }, 1500);
  }

  if (ready === false) {
    return (
      <p className="card-base p-4 text-sm text-body">
        Link inválido ou expirado.{' '}
        <Link href="/recuperar-senha" className="text-brand underline">
          Solicitar um novo link
        </Link>
        .
      </p>
    );
  }

  if (done) {
    return (
      <p className="card-base bg-brand-soft p-4 text-sm text-brand-dark">
        Senha redefinida com sucesso! Redirecionando…
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="relative">
        <Input
          label="Nova senha"
          type={show ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
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
        minLength={6}
        required
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button variant="primary" className="w-full">
        {loading ? 'Salvando...' : 'Redefinir senha'}
      </Button>
    </form>
  );
}
