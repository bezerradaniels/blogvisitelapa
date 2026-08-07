// Configuração pública do projeto. URL e publishable key são, por definição,
// enviadas ao navegador e continuam sobrescrevíveis por variável de ambiente.
// O fallback evita indisponibilidade quando um provedor de hospedagem não
// persiste NEXT_PUBLIC_* entre build e runtime.
const PUBLIC_SUPABASE_URL = 'https://uaeanrxnwqodlaltcfks.supabase.co';
const PUBLIC_SUPABASE_PUBLISHABLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWFucnhud3FvZGxhbHRjZmtzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxNTE0MTUsImV4cCI6MjA5ODcyNzQxNX0.mSsraon6ZER1_9FDXO5Hjitg96_pZQNFvlQ8-FQ3Rbw';

export function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || PUBLIC_SUPABASE_URL;
}

export function getSupabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || PUBLIC_SUPABASE_PUBLISHABLE_KEY;
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
