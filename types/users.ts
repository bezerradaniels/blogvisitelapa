// Tipos de domínio de usuários/perfis.
import type { Tables, UserRole } from './database';

export type Profile = Tables<'profiles'>;
export type { UserRole };

// Sessão simplificada usada na UI.
export interface CurrentUser {
  userId: string;
  email: string | null;
  profile: Profile | null;
  role: UserRole;
  isAdmin: boolean;
  isPublisher: boolean;
}
