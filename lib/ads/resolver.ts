import 'server-only';

// Resolve anúncios exibíveis para um placement.
// A regra completa (status ativo, período válido, criativo presente) vive na
// função SQL get_active_ads — aqui só consumimos o resultado já filtrado.
import { createClient } from '@/lib/supabase/server';
import type { AdPlacement, ResolvedAd } from '@/types/ads';

export async function getActiveAds(placement: AdPlacement): Promise<ResolvedAd[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_active_ads', { p_placement: placement });
  if (error || !data) return [];
  return data as ResolvedAd[];
}

// Retorna o anúncio de maior prioridade (ou null) para o placement.
export async function getTopAd(placement: AdPlacement): Promise<ResolvedAd | null> {
  const ads = await getActiveAds(placement);
  return ads[0] ?? null;
}
