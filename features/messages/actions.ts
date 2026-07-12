'use server';

// Server Actions de mensagens privadas (só entre amigos).
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

export interface MessageResult {
  ok: boolean;
  error?: string | null;
  conversationId?: string;
}

async function requireProfile() {
  const user = await getCurrentUser();
  if (!user?.profile) return { me: null, supabase: null, error: 'É preciso estar logado.' };
  const supabase = await createClient();
  return { me: user.profile.id, supabase, error: null };
}

// Abre (ou cria) a conversa 1:1 com um amigo. Par normalizado (a < b).
export async function openConversation(otherProfileId: string): Promise<MessageResult> {
  const { me, supabase, error } = await requireProfile();
  if (!me || !supabase) return { ok: false, error };
  if (otherProfileId === me) return { ok: false, error: 'Conversa inválida.' };

  // can_message respeita amizade, bloqueio e a permissão de mensagem do alvo.
  const { data: canMsg } = await supabase.rpc('can_message', { p_target: otherProfileId });
  if (!canMsg) return { ok: false, error: 'Esta pessoa não está aceitando mensagens.' };

  const [a, b] = me < otherProfileId ? [me, otherProfileId] : [otherProfileId, me];

  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('participant_a', a)
    .eq('participant_b', b)
    .maybeSingle();
  if (existing) return { ok: true, conversationId: existing.id };

  const { data: created, error: err } = await supabase
    .from('conversations')
    .insert({ participant_a: a, participant_b: b })
    .select('id')
    .maybeSingle();
  if (err || !created) return { ok: false, error: 'Não foi possível iniciar a conversa.' };
  return { ok: true, conversationId: created.id };
}

const messageSchema = z.object({ content: z.string().min(1, 'Escreva uma mensagem.').max(4000) });

export async function sendMessage(
  conversationId: string,
  input: z.input<typeof messageSchema>,
): Promise<MessageResult> {
  const { me, supabase, error } = await requireProfile();
  if (!me || !supabase) return { ok: false, error };

  const parsed = messageSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };

  const { error: err } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: me, content: parsed.data.content.trim() });
  if (err) return { ok: false, error: 'Não foi possível enviar a mensagem.' };

  await supabase
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversationId);

  // Notifica o outro participante.
  const { data: conv } = await supabase
    .from('conversations')
    .select('participant_a, participant_b')
    .eq('id', conversationId)
    .maybeSingle();
  if (conv) {
    const recipient = conv.participant_a === me ? conv.participant_b : conv.participant_a;
    await supabase.rpc('push_notification', {
      p_recipient: recipient,
      p_type: 'mensagem',
      p_entity: conversationId,
    });
  }

  revalidatePath(`/mensagens/${conversationId}`);
  revalidatePath('/mensagens');
  return { ok: true, conversationId };
}

export async function markConversationRead(conversationId: string): Promise<{ ok: boolean }> {
  const { me, supabase } = await requireProfile();
  if (!me || !supabase) return { ok: false };
  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .neq('sender_id', me)
    .is('read_at', null);
  return { ok: true };
}
