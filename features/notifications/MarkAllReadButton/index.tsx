'use client';

// Marca todas as notificações como lidas.
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import Button from '@/components/Button';
import { markAllNotificationsRead } from '@/features/notifications/actions';

export default function MarkAllReadButton() {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await markAllNotificationsRead();
          router.refresh();
        })
      }
    >
      {pending ? '...' : 'Marcar todas como lidas'}
    </Button>
  );
}
