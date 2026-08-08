'use server';

import { createClient } from '@/lib/supabase/server';

export async function logoutSession(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

