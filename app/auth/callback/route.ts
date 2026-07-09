// Callback de autenticação (OAuth Google / confirmação de e-mail).
// Troca o código pela sessão e redireciona para o destino.
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const rawRedirect = searchParams.get('redirect') ?? '/';
  // Só aceita caminho relativo interno (evita open redirect e host externo).
  const redirect = rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')
    ? rawRedirect
    : '/';

  // Base dos redirects: em produção atrás de proxy (Hostinger), o host público
  // vem nos headers x-forwarded-*; sem eles, usa o origin do request. Isso evita
  // cair em host interno/errado (ex.: 0.0.0.0) ou em scheme inválido.
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const base = forwardedHost ? `${forwardedProto ?? 'https'}://${forwardedHost}` : origin;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${base}${redirect}`);
    }
  }

  return NextResponse.redirect(`${base}/login?erro=auth`);
}
