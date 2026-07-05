'use client';

// Gestão de um membro (dono/admin): promover a moderador, rebaixar ou remover.
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { removeMember, setMemberRole } from '@/features/communities/actions';

interface MemberModActionsProps {
  memberId: string;
  role: string;
}

export default function MemberModActions({ memberId, role }: MemberModActionsProps) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function run(fn: () => Promise<{ ok: boolean }>) {
    start(async () => {
      const res = await fn();
      if (res.ok) router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2 text-xs font-semibold">
      {role === 'moderador' ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => setMemberRole(memberId, 'membro'))}
          className="text-brand hover:underline"
        >
          Remover moderação
        </button>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => setMemberRole(memberId, 'moderador'))}
          className="text-brand hover:underline"
        >
          Tornar moderador
        </button>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={() => run(() => removeMember(memberId))}
        className="text-danger hover:underline"
      >
        Remover
      </button>
    </div>
  );
}
