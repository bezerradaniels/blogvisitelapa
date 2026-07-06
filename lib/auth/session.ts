import 'server-only';

// Helpers de sessão no servidor. Sempre usam getUser() (revalida no servidor).
import { createClient } from '@/lib/supabase/server';
import type { CurrentUser } from '@/types/users';

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  const role = profile?.role ?? 'common_user';

  return {
    userId: user.id,
    email: user.email ?? null,
    profile: profile ?? null,
    role,
    isAdmin: role === 'admin' && profile?.status === 'active',
    isPublisher:
      (role === 'publisher' || role === 'admin') && profile?.status === 'active',
  };
}
