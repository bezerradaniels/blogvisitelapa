import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import EmptyState from '@/components/EmptyState';
import { listConversations } from '@/features/messages/queries';
import { getCurrentUser } from '@/lib/auth/session';
import { buildMetadata } from '@/lib/seo/metadata';
import { timeAgo, titleCase } from '@/lib/utils/format';

export const metadata = buildMetadata({ title: 'Mensagens', path: '/mensagens', noindex: true });
export const dynamic = 'force-dynamic';

export default async function MensagensPage() {
  const user = await getCurrentUser();
  if (!user?.profile) redirect('/login?redirect=/mensagens');

  const conversations = await listConversations(user.profile.id);

  return (
    <section className="card-base p-4 sm:p-6">
      <h1 className="mb-6 text-2xl font-extrabold text-title">Mensagens</h1>

      {conversations.length > 0 ? (
        <ul className="space-y-2">
          {conversations.map((c) => (
            <li key={c.id}>
              <Link
                href={`/mensagens/${c.id}`}
                className="card-hover card-base flex items-center gap-3 p-3"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-soft text-sm font-extrabold text-brand-dark">
                  {c.other?.avatar_url ? (
                    <Image src={c.other.avatar_url} alt="" width={44} height={44} className="object-cover" />
                  ) : (
                    (c.other?.full_name ?? 'U').charAt(0).toUpperCase()
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-bold text-title">{titleCase(c.other?.full_name) || 'Usuário'}</span>
                    <span className="shrink-0 text-xs text-muted">{timeAgo(c.lastMessageAt)}</span>
                  </div>
                  <p className="truncate text-sm text-muted">{c.lastMessage ?? 'Conversa iniciada'}</p>
                </div>
                {c.unread > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-bold text-white">
                    {c.unread}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="Nenhuma conversa ainda"
          description="Abra o perfil de um amigo e toque em “Enviar mensagem”."
        />
      )}
    </section>
  );
}
