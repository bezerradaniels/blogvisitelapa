'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/Button';
import FriendButton from '@/features/social/FriendButton';
import type { FriendState } from '@/types/social';

interface InteractionGateProps {
  kind: 'recado' | 'depoimento';
  isLogged: boolean;
  friendState: FriendState;
  targetProfileId: string;
  targetSlug: string;
  targetName: string;
}

export default function InteractionGate({
  kind,
  isLogged,
  friendState,
  targetProfileId,
  targetSlug,
  targetName,
}: InteractionGateProps) {
  const [open, setOpen] = useState(false);
  const actionLabel = kind === 'recado' ? 'Deixar recado' : 'Escrever depoimento';
  const returnPath = `/u/${targetSlug}/${kind === 'recado' ? 'recados' : 'depoimentos'}`;

  useEffect(() => {
    if (!open) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [open]);

  if (friendState === 'self' || friendState === 'friends') return null;

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>{actionLabel}</Button>
      {open && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="interaction-modal-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div className="card-base w-full max-w-md p-5 shadow-xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="interaction-modal-title" className="text-xl font-extrabold text-title">
                  {actionLabel}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Somente amigos podem deixar recados ou depoimentos. Para interagir com {targetName}, vocês precisam ser amigos na rede social.
                </p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fechar" className="text-xl text-muted hover:text-title">×</button>
            </div>

            {isLogged ? (
              <div className="mt-5 rounded-[12px] bg-surface p-4">
                <p className="mb-3 text-sm font-semibold text-title">
                  {friendState === 'request_sent'
                    ? 'Seu pedido de amizade está aguardando resposta.'
                    : friendState === 'request_received'
                      ? `${targetName} já enviou um pedido para você.`
                      : `Adicione ${targetName} para liberar esta opção.`}
                </p>
                <FriendButton
                  targetProfileId={targetProfileId}
                  state={friendState}
                  isLogged
                  targetSlug={targetSlug}
                />
              </div>
            ) : (
              <div className="mt-5">
                <p className="mb-3 text-sm font-semibold text-title">Entre na sua conta ou crie uma para enviar um pedido de amizade.</p>
                <div className="flex flex-wrap gap-2">
                  <Button href={`/login-rede-social?redirect=${encodeURIComponent(returnPath)}`} size="sm">Entrar</Button>
                  <Button href={`/cadastro?redirect=${encodeURIComponent(returnPath)}`} size="sm" variant="outline">Criar conta</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
