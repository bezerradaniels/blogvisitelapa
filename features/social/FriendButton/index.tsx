'use client';

// Botão de amizade que muda conforme o estado da relação.
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import Button from '@/components/Button';
import {
  acceptFriendRequest,
  removeFriendship,
  sendFriendRequest,
} from '@/features/social/actions';
import type { FriendState } from '@/types/social';

interface FriendButtonProps {
  targetProfileId: string;
  state: FriendState;
  isLogged: boolean;
  targetSlug: string;
}

export default function FriendButton({ targetProfileId, state, isLogged, targetSlug }: FriendButtonProps) {
  const router = useRouter();
  const [pending, start] = useTransition();

  if (state === 'self') return null;

  if (!isLogged) {
    return (
      <Button href={`/login?redirect=/u/${targetSlug}`} variant="primary" size="sm">
        Entrar para adicionar
      </Button>
    );
  }

  function run(fn: () => Promise<{ ok: boolean }>) {
    start(async () => {
      const res = await fn();
      if (res.ok) router.refresh();
    });
  }

  if (state === 'friends') {
    return (
      <Button onClick={() => run(() => removeFriendship(targetProfileId))} variant="outline" size="sm" disabled={pending}>
        {pending ? '...' : 'Amigos ✓'}
      </Button>
    );
  }

  if (state === 'request_sent') {
    return (
      <Button onClick={() => run(() => removeFriendship(targetProfileId))} variant="outline" size="sm" disabled={pending}>
        {pending ? '...' : 'Cancelar pedido'}
      </Button>
    );
  }

  if (state === 'request_received') {
    return (
      <div className="flex items-center gap-2">
        <Button onClick={() => run(() => acceptFriendRequest(targetProfileId))} variant="accent" size="sm" disabled={pending}>
          Aceitar
        </Button>
        <Button onClick={() => run(() => removeFriendship(targetProfileId))} variant="ghost" size="sm" disabled={pending}>
          Recusar
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={() => run(() => sendFriendRequest(targetProfileId))} variant="primary" size="sm" disabled={pending}>
      {pending ? '...' : 'Adicionar amigo'}
    </Button>
  );
}
