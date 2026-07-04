'use client';

// Cliente Supabase para o navegador (Client Components).
// Usa a chave anônima e respeita as políticas de RLS.
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';
import { getSupabaseAnonKey, getSupabaseUrl } from './env';

export function createClient() {
  return createBrowserClient<Database>(getSupabaseUrl(), getSupabaseAnonKey());
}
