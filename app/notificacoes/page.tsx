import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import EmptyState from '@/components/EmptyState';
import MarkAllReadButton from '@/features/notifications/MarkAllReadButton';
import { listNotifications } from '@/features/notifications/queries';
import { getCurrentUser } from '@/lib/auth/session';
import { buildMetadata } from '@/lib/seo/metadata';
import { timeAgo } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import type { NotificationWithActor } from '@/types/notifications';

export const metadata = buildMetadata({ title: 'Notificações', path: '/notificacoes', noindex: true });
export const dynamic = 'force-dynamic';

function describe(n: NotificationWithActor, mySlug: string | null): { text: string; href: string } {
  const actor = n.actor?.full_name ?? 'Alguém';
  const actorHref = n.actor?.slug ? `/u/${n.actor.slug}` : '/notificacoes';
  switch (n.type) {
    case 'amizade_pedido':
      return { text: `${actor} enviou um pedido de amizade.`, href: '/perfil' };
    case 'amizade_aceita':
      return { text: `${actor} aceitou seu pedido de amizade.`, href: actorHref };
    case 'recado':
      return { text: `${actor} deixou um recado no seu mural.`, href: mySlug ? `/u/${mySlug}` : actorHref };
    case 'depoimento':
      return { text: `${actor} escreveu um depoimento para você.`, href: '/perfil' };
    case 'mensagem':
      return { text: `${actor} enviou uma mensagem.`, href: n.entity_id ? `/mensagens/${n.entity_id}` : '/mensagens' };
    default:
      return { text: 'Nova notificação.', href: '/notificacoes' };
  }
}

export default async function NotificacoesPage() {
  const user = await getCurrentUser();
  if (!user?.profile) redirect('/login?redirect=/notificacoes');

  const notifications = await listNotifications(user.profile.id);
  const mySlug = user.profile.slug;

  return (
    <div className="container-page max-w-2xl py-8">
      <div className="mb-6 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-extrabold text-title">Notificações</h1>
        {notifications.some((n) => !n.read_at) && <MarkAllReadButton />}
      </div>

      {notifications.length > 0 ? (
        <ul className="space-y-2">
          {notifications.map((n) => {
            const { text, href } = describe(n, mySlug);
            return (
              <li key={n.id}>
                <Link
                  href={href}
                  className={cn(
                    'card-base flex items-center gap-3 p-3',
                    !n.read_at && 'border-l-4 border-l-brand',
                  )}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-soft text-sm font-extrabold text-brand-dark">
                    {n.actor?.avatar_url ? (
                      <Image src={n.actor.avatar_url} alt="" width={36} height={36} className="object-cover" />
                    ) : (
                      (n.actor?.full_name ?? 'U').charAt(0).toUpperCase()
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-body">{text}</p>
                    <span className="text-xs text-muted">{timeAgo(n.created_at)}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState title="Sem notificações" description="Interações com você aparecem aqui." />
      )}
    </div>
  );
}
