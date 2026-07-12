'use client';

// Lista de usuários bloqueados com busca e ação de desbloquear.
import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import Icon from '@/components/Icon';
import Input from '@/components/Input';
import { unblockUser } from '@/features/social/actions';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/utils/format';
import type { BlockedUser } from '@/features/settings/queries';

function Avatar({ url, name }: { url: string | null; name: string | null }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-soft text-sm font-extrabold text-brand-dark">
      {url ? (
        <Image src={url} alt="" width={40} height={40} className="h-full w-full object-cover" />
      ) : (
        (name ?? 'U').charAt(0).toUpperCase()
      )}
    </span>
  );
}

export default function BlockedUsersList({ initial }: { initial: BlockedUser[] }) {
  const router = useRouter();
  const [list, setList] = useState(initial);
  const [q, setQ] = useState('');
  const [pending, start] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return list;
    return list.filter(
      (u) =>
        (u.fullName ?? '').toLowerCase().includes(term) ||
        (u.slug ?? '').toLowerCase().includes(term),
    );
  }, [list, q]);

  function unblock(profileId: string) {
    setError(null);
    setBusyId(profileId);
    start(async () => {
      const res = await unblockUser(profileId);
      setBusyId(null);
      if (!res.ok) {
        setError(res.error ?? 'Não foi possível desbloquear.');
        return;
      }
      setList((prev) => prev.filter((u) => u.profileId !== profileId));
      router.refresh();
    });
  }

  if (list.length === 0) {
    return (
      <div className="card-base flex flex-col items-center px-6 py-12 text-center">
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface text-muted" aria-hidden>
          <Icon icon="UserMultiple02Icon" size={22} />
        </span>
        <p className="text-sm font-semibold text-title">Você não bloqueou ninguém</p>
        <p className="mt-1 max-w-xs text-xs text-muted">
          Pessoas bloqueadas não conseguem ver seu perfil, falar com você ou interagir.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Input
        type="search"
        placeholder="Buscar por nome ou usuário"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Buscar pessoas bloqueadas"
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      <ul className="divide-y divide-line rounded-[10px] border border-line">
        {filtered.map((u) => (
          <li key={u.profileId} className="flex items-center gap-3 p-3">
            <Avatar url={u.avatarUrl} name={u.fullName} />
            <div className="min-w-0 flex-1">
              {u.slug ? (
                <Link href={`/u/${u.slug}`} className="block truncate text-sm font-bold text-title hover:underline">
                  {u.fullName ?? 'Usuário'}
                </Link>
              ) : (
                <span className="block truncate text-sm font-bold text-title">{u.fullName ?? 'Usuário'}</span>
              )}
              <span className="block truncate text-xs text-muted">
                {u.slug ? `@${u.slug}` : ''} · desde {formatDate(u.since, 'd MMM yyyy')}
              </span>
            </div>
            <button
              type="button"
              onClick={() => unblock(u.profileId)}
              disabled={pending && busyId === u.profileId}
              className="inline-flex min-h-9 shrink-0 items-center rounded-full border border-line px-4 text-xs font-bold text-brand hover:bg-surface disabled:opacity-60"
            >
              {pending && busyId === u.profileId ? '…' : 'Desbloquear'}
            </button>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="p-4 text-center text-sm text-muted">Nenhum resultado para “{q}”.</li>
        )}
      </ul>
    </div>
  );
}
