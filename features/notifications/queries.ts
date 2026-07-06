import 'server-only';

// Consultas de notificações (RLS: só o destinatário lê).
import { createClient } from '@/lib/supabase/server';
import type { NotificationWithActor } from '@/types/notifications';

export async function listNotifications(profileId: string): Promise<NotificationWithActor[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('notifications')
    .select('*, actor:profiles!notifications_actor_id_fkey(id, full_name, slug, avatar_url)')
    .eq('recipient_id', profileId)
    .order('created_at', { ascending: false })
    .limit(50);
  return (data ?? []) as unknown as NotificationWithActor[];
}

export async function countUnread(profileId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_id', profileId)
    .is('read_at', null);
  return count ?? 0;
}
