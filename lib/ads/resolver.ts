import 'server-only';

// Resolve anúncios exibíveis para um placement.
// A regra completa (status ativo, período válido, criativo presente) vive na
// função SQL get_active_ads — aqui só consumimos o resultado já filtrado.
import { createClient } from '@/lib/supabase/server';
import type { AdPlacement, ResolvedAd } from '@/types/ads';

export async function getActiveAds(placement: AdPlacement): Promise<ResolvedAd[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const [campaignsResult, manualResult] = await Promise.all([
    supabase.rpc('get_active_ads', { p_placement: placement }),
    supabase
      .from('manual_ads')
      .select('id, title, placement, desktop_media_url, mobile_media_url, alternative_text, destination_url, priority')
      .eq('placement', placement)
      .eq('is_active', true)
      .lte('start_at', now)
      .or(`end_at.is.null,end_at.gte.${now}`)
      .order('priority', { ascending: false }),
  ]);

  const campaigns = (campaignsResult.data ?? []).map((ad) => ({
    ...(ad as ResolvedAd),
    tracking_enabled: true,
  }));
  const manual = (manualResult.data ?? []).map((ad) => ({
    id: ad.id,
    title: ad.title,
    placement: ad.placement,
    banner_url: ad.desktop_media_url ?? ad.mobile_media_url,
    mobile_banner_url: ad.mobile_media_url,
    link_url: ad.destination_url,
    company_name: 'Publicidade institucional',
    alternative_text: ad.alternative_text,
    priority: ad.priority,
    tracking_enabled: false,
  } satisfies ResolvedAd));

  return [...campaigns, ...manual].sort((a, b) => b.priority - a.priority);
}

// Retorna o anúncio de maior prioridade (ou null) para o placement.
export async function getTopAd(placement: AdPlacement): Promise<ResolvedAd | null> {
  const ads = await getActiveAds(placement);
  return ads[0] ?? null;
}
