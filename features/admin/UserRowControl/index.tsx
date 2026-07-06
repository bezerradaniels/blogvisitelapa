'use client';

// Controle de papel e status de um usuário.
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { setUserRole, setUserStatus } from '@/features/admin/usersActions';
import type { AccountStatus, UserRole } from '@/types/database';

interface UserRowControlProps {
  profileId: string;
  role: UserRole;
  status: AccountStatus;
  // A linha é do próprio admin logado? Usado para avisar antes de auto-rebaixar.
  isSelf?: boolean;
}

export default function UserRowControl({ profileId, role, status, isSelf }: UserRowControlProps) {
  const router = useRouter();
  const [pending, start] = useTransition();
  // Espelha o valor exibido para poder reverter quando a ação for bloqueada.
  const [roleValue, setRoleValue] = useState(role);
  const [statusValue, setStatusValue] = useState(status);

  const select =
    'h-8 rounded border border-line bg-card px-2 text-xs outline-none focus:border-brand disabled:opacity-50';

  function changeRole(next: UserRole) {
    if (isSelf && next !== 'admin') {
      if (!confirm('Isto remove o seu próprio acesso de administrador. Tem certeza?')) return;
    }
    setRoleValue(next);
    start(async () => {
      const res = await setUserRole(profileId, next);
      if (!res.ok) {
        alert(res.error ?? 'Não foi possível atualizar.');
        setRoleValue(role); // reverte
        return;
      }
      router.refresh();
    });
  }

  function changeStatus(next: AccountStatus) {
    if (isSelf && next !== 'active') {
      if (!confirm('Isto desativa a sua própria conta. Tem certeza?')) return;
    }
    setStatusValue(next);
    start(async () => {
      const res = await setUserStatus(profileId, next);
      if (!res.ok) {
        alert(res.error ?? 'Não foi possível atualizar.');
        setStatusValue(status); // reverte
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={roleValue}
        disabled={pending}
        className={select}
        onChange={(e) => changeRole(e.target.value as UserRole)}
      >
        <option value="common_user">Usuário</option>
        <option value="publisher">Publisher</option>
        <option value="admin">Admin</option>
      </select>
      <select
        value={statusValue}
        disabled={pending}
        className={select}
        onChange={(e) => changeStatus(e.target.value as AccountStatus)}
      >
        <option value="active">Ativo</option>
        <option value="suspended">Suspenso</option>
        <option value="pending">Pendente</option>
      </select>
    </div>
  );
}
