import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import MessageComposer from '@/features/messages/MessageComposer';
import { markConversationRead } from '@/features/messages/actions';
import { getConversation, listMessages } from '@/features/messages/queries';
import { getCurrentUser } from '@/lib/auth/session';
import { buildMetadata } from '@/lib/seo/metadata';
import { formatDateTime } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

export const metadata = buildMetadata({ title: 'Conversa', noindex: true });
export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ConversaPage({ params }: Props) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user?.profile) redirect(`/login?redirect=/mensagens/${id}`);

  const conversation = await getConversation(id, user.profile.id);
  if (!conversation) notFound();

  const messages = await listMessages(id);
  // Marca as recebidas como lidas ao abrir.
  await markConversationRead(id);

  const me = user.profile.id;

  return (
    <section className="card-base p-4 sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <Link href="/mensagens" className="text-sm font-bold text-brand hover:underline">
          ←
        </Link>
        <Link href={`/u/${conversation.other?.slug}`} className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-brand-soft text-sm font-extrabold text-brand-dark">
            {conversation.other?.avatar_url ? (
              <Image src={conversation.other.avatar_url} alt="" width={36} height={36} className="object-cover" />
            ) : (
              (conversation.other?.full_name ?? 'U').charAt(0).toUpperCase()
            )}
          </span>
          <span className="font-bold text-title">{conversation.other?.full_name ?? 'Usuário'}</span>
        </Link>
      </div>

      <ul className="mb-4 space-y-2">
        {messages.map((m) => {
          const mine = m.sender_id === me;
          return (
            <li key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-3 py-2 text-sm',
                  mine ? 'bg-brand text-white' : 'bg-surface text-body',
                )}
              >
                <p className="whitespace-pre-wrap">{m.content}</p>
                <time className={cn('mt-1 block text-[10px]', mine ? 'text-white/70' : 'text-muted')} dateTime={m.created_at}>
                  {formatDateTime(m.created_at)}
                </time>
              </div>
            </li>
          );
        })}
        {messages.length === 0 && (
          <li className="text-center text-sm text-muted">Nenhuma mensagem ainda. Diga olá!</li>
        )}
      </ul>

      <MessageComposer conversationId={id} />
    </section>
  );
}
