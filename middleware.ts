// Middleware raiz do Next.js.
// Renova a sessão do Supabase e aplica a proteção de rotas por papel.
import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Aplica em todas as rotas, exceto estáticos e imagens otimizadas.
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
