'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import Textarea from '@/components/Textarea';
import {
  deleteUserPermanently,
  setUserAttention,
  setUserSuspended,
} from '@/features/admin/usersActions';

interface UserAdminActionsProps {
  profileId: string;
  fullName: string;
  isSelf: boolean;
  isSuspended: boolean;
  attention: { note: string | null; flaggedAt: string } | null;
}

export default function UserAdminActions({
  profileId,
  fullName,
  isSelf,
  isSuspended,
  attention,
}: UserAdminActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState(attention?.note ?? '');

  function suspend() {
    const verb = isSuspended ? 'reativar' : 'suspender';
    if (!confirm(`Tem certeza que deseja ${verb} a conta de ${fullName}?`)) return;
    startTransition(async () => {
      const result = await setUserSuspended(profileId, !isSuspended);
      if (!result.ok) return alert(result.error ?? 'Não foi possível atualizar a conta.');
      router.refresh();
    });
  }

  function saveAttention(flagged: boolean) {
    startTransition(async () => {
      const result = await setUserAttention(profileId, flagged, note);
      if (!result.ok) return alert(result.error ?? 'Não foi possível atualizar a sinalização.');
      if (!flagged) setNote('');
      router.refresh();
    });
  }

  function removePermanently() {
    const confirmation = prompt(
      `Esta ação é irreversível e removerá a conta e os dados relacionados.\n\nDigite EXCLUIR para confirmar a exclusão de ${fullName}.`,
    );
    if (confirmation !== 'EXCLUIR') return;

    startTransition(async () => {
      const result = await deleteUserPermanently(profileId);
      if (!result.ok) return alert(result.error ?? 'Não foi possível excluir a conta.');
      router.push('/admin/usuarios');
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <section className="card-base space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-title">Atenção interna</h3>
            <p className="text-xs text-muted">Visível exclusivamente para administradores.</p>
          </div>
          {attention && <Badge tone="warning">Sinalizado</Badge>}
        </div>
        <Textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={2000}
          rows={4}
          disabled={pending}
          placeholder="Registre aqui o motivo da atenção ou orientações para outros admins."
        />
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="accent" disabled={pending} onClick={() => saveAttention(true)}>
            {attention ? 'Atualizar sinalização' : 'Sinalizar atenção'}
          </Button>
          {attention && (
            <Button size="sm" variant="outline" disabled={pending} onClick={() => saveAttention(false)}>
              Remover sinalização
            </Button>
          )}
        </div>
      </section>

      <section className="card-base space-y-3 border-danger/30 p-4">
        <div>
          <h3 className="font-bold text-title">Ações da conta</h3>
          <p className="text-xs text-muted">A suspensão pode ser revertida. A exclusão é definitiva.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={isSuspended ? 'primary' : 'outline'}
            disabled={pending || isSelf}
            onClick={suspend}
          >
            {isSuspended ? 'Reativar conta' : 'Suspender conta'}
          </Button>
          <Button size="sm" variant="danger" disabled={pending || isSelf} onClick={removePermanently}>
            Excluir definitivamente
          </Button>
        </div>
        {isSelf && <p className="text-xs text-warning">Você não pode suspender ou excluir a própria conta.</p>}
      </section>
    </div>
  );
}
