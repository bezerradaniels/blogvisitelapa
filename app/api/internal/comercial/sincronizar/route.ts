import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// Endpoint para cron do servidor/hospedagem. Não aceita sessão de navegador:
// exige um segredo próprio e executa a função idempotente com service role.
export async function POST(request: Request) {
  const secret = process.env.COMMERCIAL_SYNC_SECRET;
  const authorization = request.headers.get('authorization');
  if (!secret) {
    return NextResponse.json({ error: 'Rotina comercial não configurada.' }, { status: 503 });
  }
  if (authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc('sync_commercial_statuses');
    if (error) return NextResponse.json({ error: 'Não foi possível sincronizar os estados comerciais.' }, { status: 500 });
    return NextResponse.json({ ok: true, result: data });
  } catch {
    return NextResponse.json({ error: 'Não foi possível executar a rotina comercial.' }, { status: 500 });
  }
}
