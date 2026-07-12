'use client';

// Verificação em duas etapas (TOTP) usando o MFA nativo do Supabase.
// Fluxo: enroll → mostra QR + chave → challenge + verify → fator "verificado".
// O QR é gerado pelo próprio Supabase (sem libs externas).
import { useEffect, useState } from 'react';
import Button from '@/components/Button';
import Icon from '@/components/Icon';
import Input from '@/components/Input';
import { createClient } from '@/lib/supabase/client';

type Factor = { id: string; status: string; friendly_name?: string };

export default function TwoFactorManager() {
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState<Factor | null>(null);
  const [enroll, setEnroll] = useState<{ factorId: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const supabase = createClient();
    const { data, error: err } = await supabase.auth.mfa.listFactors();
    setLoading(false);
    if (err) {
      setError('Não foi possível carregar o 2FA.');
      return;
    }
    const totp = (data?.totp ?? []) as Factor[];
    setVerified(totp.find((f) => f.status === 'verified') ?? null);
  }

  // Carrega os fatores ao montar (setState só após o await, dentro da promise).
  useEffect(() => {
    let active = true;
    void (async () => {
      const supabase = createClient();
      const { data, error: err } = await supabase.auth.mfa.listFactors();
      if (!active) return;
      setLoading(false);
      if (err) {
        setError('Não foi possível carregar o 2FA.');
        return;
      }
      const totp = (data?.totp ?? []) as Factor[];
      setVerified(totp.find((f) => f.status === 'verified') ?? null);
    })();
    return () => {
      active = false;
    };
  }, []);

  async function startEnroll() {
    setError(null);
    setBusy(true);
    const supabase = createClient();
    // Remove fatores TOTP não verificados pendentes (evita duplicar).
    const { data: list } = await supabase.auth.mfa.listFactors();
    for (const f of (list?.totp ?? []) as Factor[]) {
      if (f.status !== 'verified') await supabase.auth.mfa.unenroll({ factorId: f.id });
    }
    const { data, error: err } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
    setBusy(false);
    if (err || !data) {
      setError(
        err?.message?.toLowerCase().includes('disabled')
          ? 'O 2FA não está habilitado no projeto. Ative o TOTP nas configurações de Auth do Supabase.'
          : err?.message ?? 'Não foi possível iniciar o 2FA.',
      );
      return;
    }
    setEnroll({ factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  }

  async function confirmEnroll(e: React.FormEvent) {
    e.preventDefault();
    if (!enroll) return;
    setError(null);
    setBusy(true);
    const supabase = createClient();
    const { data: ch, error: chErr } = await supabase.auth.mfa.challenge({ factorId: enroll.factorId });
    if (chErr || !ch) {
      setBusy(false);
      setError('Não foi possível validar. Tente novamente.');
      return;
    }
    const { error: vErr } = await supabase.auth.mfa.verify({
      factorId: enroll.factorId,
      challengeId: ch.id,
      code: code.trim(),
    });
    setBusy(false);
    if (vErr) {
      setError('Código inválido. Confira o app autenticador e tente de novo.');
      return;
    }
    setEnroll(null);
    setCode('');
    await refresh();
  }

  async function disable() {
    if (!verified) return;
    setError(null);
    setBusy(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.mfa.unenroll({ factorId: verified.id });
    setBusy(false);
    if (err) {
      setError('Não foi possível desativar o 2FA.');
      return;
    }
    await refresh();
  }

  function cancelEnroll() {
    if (enroll) {
      const supabase = createClient();
      supabase.auth.mfa.unenroll({ factorId: enroll.factorId });
    }
    setEnroll(null);
    setCode('');
    setError(null);
  }

  if (loading) {
    return <div className="h-16 animate-pulse rounded-[10px] bg-surface" aria-hidden />;
  }

  if (verified) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 rounded-[10px] border border-brand-soft bg-brand-soft/50 px-3 py-2.5 text-sm font-semibold text-brand-dark">
          <Icon icon="Shield01Icon" size={18} />
          Verificação em duas etapas ativada.
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button variant="danger" size="sm" onClick={disable} disabled={busy}>
          {busy ? 'Desativando…' : 'Desativar 2FA'}
        </Button>
      </div>
    );
  }

  if (enroll) {
    return (
      <form onSubmit={confirmEnroll} className="space-y-3">
        <p className="text-sm text-muted">
          Escaneie o QR no seu app autenticador (Google Authenticator, Authy…) ou digite a chave
          manualmente. Depois informe o código de 6 dígitos.
        </p>
        <div className="flex flex-col items-start gap-3 sm:flex-row">
          <div
            className="h-40 w-40 shrink-0 rounded-[10px] border border-line bg-white p-2"
            // QR gerado pelo Supabase (conteúdo confiável).
            dangerouslySetInnerHTML={
              enroll.qr.startsWith('<svg')
                ? { __html: enroll.qr }
                : { __html: `<img src="${enroll.qr}" alt="QR do 2FA" width="144" height="144" />` }
            }
          />
          <div className="min-w-0">
            <span className="text-xs font-semibold text-muted">Chave manual</span>
            <code className="mt-1 block break-all rounded bg-surface px-2 py-1 text-xs text-body">
              {enroll.secret}
            </code>
          </div>
        </div>
        <Input
          label="Código de verificação"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="000000"
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" disabled={busy || code.trim().length < 6}>
            {busy ? 'Verificando…' : 'Ativar'}
          </Button>
          <button
            type="button"
            onClick={cancelEnroll}
            className="text-sm font-bold text-muted hover:text-body"
          >
            Cancelar
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        Adicione uma camada extra de segurança exigindo um código do seu celular ao entrar.
      </p>
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button variant="primary" size="sm" onClick={startEnroll} disabled={busy}>
        {busy ? 'Preparando…' : 'Ativar 2FA'}
      </Button>
    </div>
  );
}
