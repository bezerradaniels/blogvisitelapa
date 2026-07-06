// Tipos de domínio das notificações.
import type { Tables } from './database';
import type { CommunityProfile } from './communities';

export type Notification = Tables<'notifications'>;

export type NotificationWithActor = Notification & { actor: CommunityProfile | null };
