'use client';

// Permissões de interação: quem pode enviar pedido de amizade e quem pode
// mandar mensagem. Aplicadas de verdade no banco (0023: can_request_friendship,
// can_message + RLS de friendships).
import { useState } from 'react';
import Button from '@/components/Button';
import Select from '@/components/Select';
import SettingsSection from '@/components/SettingsSection';
import { saveInteractionSettings } from '@/features/settings/actions';
import type { InteractionAudience } from '@/types/database';

interface Props {
  initial: {
    friend_request_permission: InteractionAudience;
    message_permission: InteractionAudience;
  };
}

const FRIEND_OPTS = [
  { value: 'todos', label: 'Qualquer pessoa' },
  { value: 'amigos_de_amigos', label: 'Amigos de amigos' },
  { value: 'ninguem', label: 'Ninguém' },
];
const MESSAGE_OPTS = [
  { value: 'amigos', label: 'Meus amigos' },
  { value: 'ninguem', label: 'Ninguém' },
];

export default function InteractionsForm({ initial }: Props) {
  // Normaliza valores fora das opções oferecidas para um padrão seguro.
  const [friendReq, setFriendReq] = useState<string>(
    ['todos', 'amigos_de_amigos', 'ninguem'].includes(initial.friend_request_permission)
      ? initial.friend_request_permission
      : 'todos',
  );
  const [message, setMessage] = useState<string>(
    initial.message_permission === 'ninguem' ? 'ninguem' : 'amigos',
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setLoading(true);
    const res = await saveInteractionSettings({
      friend_request_permission: friendReq as 'todos' | 'amigos_de_amigos' | 'ninguem',
      message_permission: message as 'amigos' | 'ninguem',
    });
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? 'Não foi possível salvar.');
      return;
    }
    setSaved(true);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <SettingsSection title="Amizades">
        <Select
          label="Quem pode me enviar pedido de amizade"
          options={FRIEND_OPTS}
          value={friendReq}
          onChange={(e) => {
            setFriendReq(e.target.value);
            setSaved(false);
          }}
        />
        <p className="mt-1 text-xs text-muted">
          “Amigos de amigos” só permite pedidos de quem tem amigos em comum com você.
        </p>
      </SettingsSection>

      <SettingsSection title="Mensagens">
        <Select
          label="Quem pode me enviar mensagens"
          options={MESSAGE_OPTS}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            setSaved(false);
          }}
        />
        <p className="mt-1 text-xs text-muted">
          As conversas continuam sendo apenas entre amigos. “Ninguém” desativa o recebimento
          de mensagens, mesmo de amigos.
        </p>
      </SettingsSection>

      {error && <p className="text-sm text-danger">{error}</p>}
      {saved && <p className="text-sm text-brand-dark">Preferências salvas.</p>}

      <Button variant="primary" disabled={loading}>
        {loading ? 'Salvando…' : 'Salvar'}
      </Button>
    </form>
  );
}
