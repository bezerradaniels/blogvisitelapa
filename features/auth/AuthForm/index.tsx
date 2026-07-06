'use client';

// Formulário de login/cadastro com e-mail+senha e login com Google.
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { createClient } from '@/lib/supabase/client';
import { absoluteUrl } from '@/lib/config/site';

interface AuthFormProps {
  mode: 'login' | 'signup';
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get('redirect') ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [consent, setConsent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (mode === 'signup' && !consent) {
      setError('É preciso aceitar os Termos de Uso e a Política de Privacidade.');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    if (mode === 'signup') {
      const { error: err } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name }, emailRedirectTo: absoluteUrl('/auth/callback') },
      });
      setLoading(false);
      if (err) return setError(traduzErro(err.message));
      setNotice('Cadastro criado! Verifique seu e-mail para confirmar a conta.');
      return;
    }

    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) return setError(traduzErro(err.message));
    router.push(redirect);
    router.refresh();
  }

  async function handleGoogle() {
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: absoluteUrl(`/auth/callback?redirect=${encodeURIComponent(redirect)}`) },
    });
    if (err) setError('Não foi possível conectar com o Google.');
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={handleGoogle}
        className="flex h-10 w-full items-center justify-center gap-2 rounded border border-line bg-card text-sm font-medium hover:bg-surface"
      >
        Continuar com o Google
      </button>

      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" />ou<span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={handleEmail} className="space-y-3">
        {mode === 'signup' && (
          <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} required />
        )}
        <Input
          label="E-mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div className="relative">
          <Input
            label="Senha"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            className="absolute right-2 top-8 text-xs font-semibold text-brand hover:underline"
          >
            {showPassword ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>

        {mode === 'login' && (
          <p className="text-right">
            <Link href="/recuperar-senha" className="text-xs font-semibold text-brand hover:underline">
              Esqueci minha senha
            </Link>
          </p>
        )}

        {mode === 'signup' && (
          <label className="flex items-start gap-2 text-xs text-muted">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-line text-brand focus:ring-brand"
            />
            <span>
              Li e aceito os{' '}
              <Link href="/termos-de-uso" className="text-brand underline" target="_blank">
                Termos de Uso
              </Link>{' '}
              e a{' '}
              <Link href="/politica-de-privacidade" className="text-brand underline" target="_blank">
                Política de Privacidade
              </Link>
              .
            </span>
          </label>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}
        {notice && <p className="text-sm text-brand-dark">{notice}</p>}
        <Button variant="primary" className="w-full">
          {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted">
        {mode === 'login' ? (
          <>
            Não tem conta?{' '}
            <Link href="/cadastro" className="text-brand underline">
              Cadastre-se
            </Link>
          </>
        ) : (
          <>
            Já tem conta?{' '}
            <Link href="/login" className="text-brand underline">
              Entrar
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

function traduzErro(message: string): string {
  if (/invalid login credentials/i.test(message)) return 'E-mail ou senha inválidos.';
  if (/already registered/i.test(message)) return 'Este e-mail já está cadastrado.';
  return 'Ocorreu um erro. Tente novamente.';
}
