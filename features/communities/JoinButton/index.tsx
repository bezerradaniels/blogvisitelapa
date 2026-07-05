'use client';

// Entrar/sair de uma comunidade (otimista via useTransition + refresh).
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import Button from '@/components/Button';
import { joinCommunity, leaveCommunity } from '@/features/communities/actions';

interface JoinButtonProps {
  communityId: string;
  isMember: boolean;
  isLogged: boolean;
}

export default function JoinButton({ communityId, isMember, isLogged }: JoinButtonProps) {
  const router = useRouter();
  const [pending, start] = useTransition();

  if (!isLogged) {
    return (
      <Button href={`/login?redirect=/comunidades`} variant="primary" size="sm">
        Entrar para participar
      </Button>
    );
  }

  function toggle() {
    start(async () => {
      const res = isMember
        ? await leaveCommunity(communityId)
        : await joinCommunity(communityId);
      if (res.ok) router.refresh();
    });
  }

  return (
    <Button
      onClick={toggle}
      variant={isMember ? 'outline' : 'accent'}
      size="sm"
      disabled={pending}
    >
      {pending ? '...' : isMember ? 'Sair da comunidade' : 'Participar'}
    </Button>
  );
}
