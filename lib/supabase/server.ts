import 'server-only';

// Cliente Supabase para Server Components, Route Handlers e Server Actions.
// Lê/grava os cookies de sessão e respeita as políticas de RLS.
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';
import { getSupabaseAnonKey, getSupabaseUrl } from './env';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Chamado a partir de um Server Component: a atualização de cookies é
          // tratada pelo middleware. Pode ser ignorado com segurança.
        }
      },
    },
  });
}
