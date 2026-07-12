'use client';

// Formulário da Conta: nome, nome de usuário (com verificação de disponibilidade)
// e telefone. E-mail é somente leitura nesta fase (troca com verificação virá
// na área de Segurança).
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Button from '@/components/Button';
import Input from '@/components/Input';
import SettingsSection from '@/components/SettingsSection';
import { checkUsername, saveAccount } from '@/features/settings/actions';

interface AccountFormProps {
  initial: { full_name: string; username: string; phone: string; email: string };
}

export default function AccountForm({ initial }: AccountFormProps) {
  const router = useRouter();
  const [f, setF] = useState(initial);
  const [usernameStatus, setUsernameStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof f>(key: K, value: (typeof f)[K]) {
    setF((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function verifyUsername() {
    if (!f.username || f.username === initial.username) {
      setUsernameStatus(null);
      return;
    }
    const res = await checkUsername(f.username);
    setUsernameStatus({ ok: res.available, msg: res.available ? 'Disponível.' : res.reason ?? 'Indisponível.' });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setLoading(true);
    const res = await saveAccount({ full_name: f.full_name, username: f.username, phone: f.phone });
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? 'Não foi possível salvar.');
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <SettingsSection title="Informações básicas">
        <div className="space-y-4">
          <Input
            label="Nome"
            value={f.full_name}
            onChange={(e) => set('full_name', e.target.value)}
            required
          />
          <div>
            <Input
              label="Nome de usuário"
              value={f.username}
              onChange={(e) => set('username', e.target.value.toLowerCase())}
              onBlur={verifyUsername}
              placeholder="ex.: maria-lapa"
              aria-describedby="username-hint"
            />
            <p id="username-hint" className="mt-1 text-xs text-muted">
              Aparece no endereço do seu perfil: conectalapa.com.br/u/{f.username || 'seu-usuario'}.
              Letras minúsculas, números e hífen.
            </p>
            {usernameStatus && (
              <p className={`mt-1 text-xs ${usernameStatus.ok ? 'text-brand-dark' : 'text-danger'}`}>
                {usernameStatus.msg}
              </p>
            )}
          </div>
          <Input
            label="Telefone"
            value={f.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="(77) 99999-9999"
          />
        </div>
      </SettingsSection>

      <SettingsSection title="Acesso">
        <div className="space-y-1">
          <span className="text-xs font-medium text-body">E-mail de login</span>
          <div className="flex h-10 items-center rounded-[10px] border border-line bg-surface px-3 text-sm text-muted">
            {f.email || '—'}
          </div>
          <p className="text-xs text-muted">
            Usado apenas para entrar. Nunca aparece no seu perfil público.
          </p>
        </div>
      </SettingsSection>

      {error && <p className="text-sm text-danger">{error}</p>}
      {saved && <p className="text-sm text-brand-dark">Conta atualizada.</p>}

      <div className="flex items-center gap-3">
        <Button variant="primary" disabled={loading}>
          {loading ? 'Salvando…' : 'Salvar'}
        </Button>
      </div>
    </form>
  );
}
