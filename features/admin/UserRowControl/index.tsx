'use client';

// Controle de papel e status de um usuário.
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { setUserRole, setUserStatus } from '@/features/admin/usersActions';
import type { AccountStatus, UserRole } from '@/types/database';

interface UserRowControlProps {
  profileId: string;
  role: UserRole;
  status: AccountStatus;
}

export default function UserRowControl({ profileId, role, status }: UserRowControlProps) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const select = 'h-8 rounded border border-line bg-card px-2 text-xs outline-none focus:border-brand disabled:opacity-50';

  return (
    <div className="flex items-center gap-2">
      <select
        value={role}
        disabled={pending}
        className={select}
        onChange={(e) =>
          start(async () => {
            await setUserRole(profileId, e.target.value as UserRole);
            router.refresh();
          })
        }
      >
        <option value="common_user">Usuário</option>
        <option value="publisher">Publisher</option>
        <option value="admin">Admin</option>
      </select>
      <select
        value={status}
        disabled={pending}
        className={select}
        onChange={(e) =>
          start(async () => {
            await setUserStatus(profileId, e.target.value as AccountStatus);
            router.refresh();
          })
        }
      >
        <option value="active">Ativo</option>
        <option value="suspended">Suspenso</option>
        <option value="pending">Pendente</option>
      </select>
    </div>
  );
}
