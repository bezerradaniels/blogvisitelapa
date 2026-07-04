// Atualiza a sessão do Supabase a cada request e protege rotas por papel.
// Chamado pelo middleware raiz (middleware.ts).
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database';
import { getSupabaseAnonKey, getSupabaseUrl } from './env';

// Prefixos que exigem autenticação e/ou papel específico.
const ADMIN_PREFIX = '/admin';
const PUBLISHER_PREFIX = '/publisher';
const AUTH_ONLY_PREFIXES = ['/perfil', '/favoritos'];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // IMPORTANTE: getUser() revalida o token no servidor (não confie só no cookie).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const needsAuth =
    pathname.startsWith(ADMIN_PREFIX) ||
    pathname.startsWith(PUBLISHER_PREFIX) ||
    AUTH_ONLY_PREFIXES.some((p) => pathname.startsWith(p));

  // Sem sessão em rota protegida → redireciona para login com retorno.
  if (needsAuth && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Checagem de papel para /admin e /publisher.
  if (user && (pathname.startsWith(ADMIN_PREFIX) || pathname.startsWith(PUBLISHER_PREFIX))) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, status')
      .eq('user_id', user.id)
      .single();

    const role = profile?.role ?? 'common_user';
    const active = profile?.status === 'active';

    const canAdmin = role === 'admin' && active;
    const canPublish = (role === 'admin' || role === 'publisher') && active;

    if (pathname.startsWith(ADMIN_PREFIX) && !canAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
    if (pathname.startsWith(PUBLISHER_PREFIX) && !canPublish) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  return response;
}
