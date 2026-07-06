'use client';

// Abre (ou cria) a conversa com um amigo e navega para a thread.
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import Button from '@/components/Button';
import { openConversation } from '@/features/messages/actions';

export default function NewMessageButton({ targetProfileId }: { targetProfileId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function open() {
    setError(null);
    start(async () => {
      const res = await openConversation(targetProfileId);
      if (res.ok && res.conversationId) {
        router.push(`/mensagens/${res.conversationId}`);
      } else {
        setError(res.error ?? 'Não foi possível abrir a conversa.');
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button onClick={open} variant="outline" size="sm" disabled={pending}>
        {pending ? '...' : 'Enviar mensagem'}
      </Button>
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}
