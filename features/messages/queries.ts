import 'server-only';

// Consultas de mensagens privadas (RLS: só participantes).
import { createClient } from '@/lib/supabase/server';
import type { CommunityProfile } from '@/types/communities';
import type { ConversationSummary, Message } from '@/types/messages';

const P = 'id, full_name, slug, avatar_url';

interface ConvRow {
  id: string;
  participant_a: string;
  participant_b: string;
  last_message_at: string;
  a: CommunityProfile | null;
  b: CommunityProfile | null;
}

export async function listConversations(profileId: string): Promise<ConversationSummary[]> {
  const supabase = await createClient();
  const { data: convs } = await supabase
    .from('conversations')
    .select(
      `id, participant_a, participant_b, last_message_at,
       a:profiles!conversations_participant_a_fkey(${P}),
       b:profiles!conversations_participant_b_fkey(${P})`,
    )
    .or(`participant_a.eq.${profileId},participant_b.eq.${profileId}`)
    .order('last_message_at', { ascending: false })
    .limit(100);

  const rows = (convs ?? []) as unknown as ConvRow[];
  if (rows.length === 0) return [];

  // Prévia + não-lidas em uma consulta só (agregadas em JS).
  const ids = rows.map((r) => r.id);
  const { data: msgs } = await supabase
    .from('messages')
    .select('conversation_id, sender_id, content, read_at, created_at')
    .in('conversation_id', ids)
    .order('created_at', { ascending: false })
    .limit(400);

  const last = new Map<string, string>();
  const unread = new Map<string, number>();
  for (const m of (msgs ?? []) as Pick<Message, 'conversation_id' | 'sender_id' | 'content' | 'read_at'>[]) {
    if (!last.has(m.conversation_id)) last.set(m.conversation_id, m.content);
    if (m.sender_id !== profileId && !m.read_at) {
      unread.set(m.conversation_id, (unread.get(m.conversation_id) ?? 0) + 1);
    }
  }

  return rows.map((r) => ({
    id: r.id,
    other: r.participant_a === profileId ? r.b : r.a,
    lastMessage: last.get(r.id) ?? null,
    lastMessageAt: r.last_message_at,
    unread: unread.get(r.id) ?? 0,
  }));
}

export async function getConversation(
  conversationId: string,
  profileId: string,
): Promise<{ id: string; other: CommunityProfile | null } | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('conversations')
    .select(
      `id, participant_a, participant_b,
       a:profiles!conversations_participant_a_fkey(${P}),
       b:profiles!conversations_participant_b_fkey(${P})`,
    )
    .eq('id', conversationId)
    .maybeSingle();
  if (!data) return null;
  const row = data as unknown as ConvRow;
  return { id: row.id, other: row.participant_a === profileId ? row.b : row.a };
}

export async function listMessages(conversationId: string): Promise<Message[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(500);
  return (data ?? []) as Message[];
}
