// Callback de autenticação (OAuth Google / confirmação de e-mail).
// Troca o código pela sessão e redireciona para o destino.
import { NextResponse, type NextRequest } from 'next/server';
import { getSiteUrl } from '@/lib/config/site';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const rawRedirect = searchParams.get('redirect') ?? '/';
  // Só aceita caminho relativo interno (evita open redirect e host externo).
  const redirect =
    rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : '/';

  // Base dos redirects: sempre o host canônico (NEXT_PUBLIC_SITE_URL), nunca o
  // origin do request. Atrás do proxy da Hostinger o origin resolve para um host
  // interno (ex.: 0.0.0.0) com scheme inválido; usar o canônico evita isso e
  // garante que o host bata com o do cookie PKCE (code_verifier).
  const base = getSiteUrl();

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${base}${redirect}`);
    }
  }

  return NextResponse.redirect(`${base}/login?erro=auth`);
}
