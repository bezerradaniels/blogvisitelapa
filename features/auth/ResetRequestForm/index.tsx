'use client';

// Solicita o e-mail de redefinição de senha.
// Por segurança, não revelamos se o e-mail existe (evita enumeração de contas).
import { useState } from 'react';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { absoluteUrl } from '@/lib/config/site';
import { createClient } from '@/lib/supabase/client';

export default function ResetRequestForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    // O link do e-mail passa pelo callback (troca o código pela sessão) e cai
    // em /redefinir-senha já autenticado.
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: absoluteUrl('/auth/callback?redirect=/redefinir-senha'),
    });
    setLoading(false);
    setDone(true);
  }

  if (done) {
    return (
      <p className="card-base bg-brand-soft p-4 text-sm text-brand-dark">
        Se houver uma conta com esse e-mail, enviamos um link para redefinir a senha. Verifique sua
        caixa de entrada e o spam.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Input
        label="E-mail"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Button variant="primary" className="w-full">
        {loading ? 'Enviando...' : 'Enviar link de redefinição'}
      </Button>
    </form>
  );
}
