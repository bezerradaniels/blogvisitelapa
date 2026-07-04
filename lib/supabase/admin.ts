import 'server-only';

// Cliente Supabase com a service role — IGNORA RLS.
// Use somente em código server-only e apenas quando estritamente necessário
// (ex.: promoção de admin, rotinas administrativas). Nunca no cliente.
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { getSupabaseServiceRoleKey, getSupabaseUrl } from './env';

export function createAdminClient() {
  return createClient<Database>(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
