// Leitura e validação das variáveis de ambiente do Supabase.
// Falha cedo e com mensagem clara se algo estiver faltando.

export function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL não configurada. Veja o .env.example.');
  }
  return url;
}

export function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY não configurada. Veja o .env.example.');
  }
  return key;
}

// Chave de serviço — apenas em contexto de servidor. Nunca importe no cliente.
export function getSupabaseServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY não configurada. Necessária apenas em rotinas server-only.',
    );
  }
  return key;
}
