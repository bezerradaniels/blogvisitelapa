import 'server-only';

// Porteiro único das server actions de admin.
// Centraliza a checagem "é admin ativo?" (antes duplicada em cada *Actions.ts)
// e já entrega o client do Supabase + o id do profile do admin logado.
// Retorna null quando o usuário não é admin — cada action traduz isso no seu
// próprio formato de erro (ex.: { ok: false, error: 'Acesso restrito.' }).
import { getCurrentUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import type { CurrentUser } from '@/types/users';

export interface AdminContext {
  user: CurrentUser;
  supabase: Awaited<ReturnType<typeof createClient>>;
  profileId: string;
}

export async function adminGuard(): Promise<AdminContext | null> {
  const user = await getCurrentUser();
  if (!user?.isAdmin || !user.profile) return null;
  const supabase = await createClient();
  return { user, supabase, profileId: user.profile.id };
}
