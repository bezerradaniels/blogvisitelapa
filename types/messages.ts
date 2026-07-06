// Tipos de domínio das mensagens privadas.
import type { Tables } from './database';
import type { CommunityProfile } from './communities';

export type Message = Tables<'messages'>;

// Conversa com o outro participante resolvido + prévia e não-lidas.
export interface ConversationSummary {
  id: string;
  other: CommunityProfile | null;
  lastMessage: string | null;
  lastMessageAt: string;
  unread: number;
}
