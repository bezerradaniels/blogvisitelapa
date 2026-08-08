import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  if (Number(request.headers.get('content-length') ?? 0) > 256) {
    return NextResponse.json({ error: 'Payload inválido.' }, { status: 413 });
  }

  try {
    const payload = await request.json() as { campaignId?: unknown; event?: unknown };
    if (
      typeof payload.campaignId !== 'string'
      || !UUID_PATTERN.test(payload.campaignId)
      || (payload.event !== 'impression' && payload.event !== 'click')
    ) {
      return NextResponse.json({ error: 'Evento inválido.' }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase.rpc('record_ad_event', {
      p_campaign_id: payload.campaignId,
      p_event: payload.event,
    });

    if (error) {
      return NextResponse.json({ error: 'Não foi possível registrar o evento.' }, { status: 500 });
    }

    return new NextResponse(null, {
      status: 204,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json({ error: 'Evento inválido.' }, { status: 400 });
  }
}

