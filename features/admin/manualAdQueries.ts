import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { AdPlacement } from '@/types/database';
import { campaignAdInventory } from '@/lib/config/adInventory';

export interface ManualAdRow {
  id: string;
  title: string;
  placement: AdPlacement;
  desktop_media_url: string | null;
  mobile_media_url: string | null;
  alternative_text: string | null;
  destination_url: string | null;
  start_at: string;
  end_at: string | null;
  priority: number;
  is_active: boolean;
  created_at: string;
}

export interface PaidAdPeriod {
  id: string;
  title: string;
  startAt: string;
  endAt: string | null;
}

export interface ManualPlacementStatus {
  code: AdPlacement;
  name: string;
  desktop: string;
  mobile: string;
  paidAds: PaidAdPeriod[];
  manualAds: ManualAdRow[];
}

export async function listManualAds(): Promise<ManualAdRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from('manual_ads').select('id, title, placement, desktop_media_url, mobile_media_url, alternative_text, destination_url, start_at, end_at, priority, is_active, created_at').order('created_at', { ascending: false });
  return data ?? [];
}

export async function listManualPlacementStatuses(): Promise<ManualPlacementStatus[]> {
  const supabase = await createClient();
  const manualAds = await listManualAds();
  const paidResults = await Promise.all(campaignAdInventory.map((item) => supabase.rpc('get_active_ads', { p_placement: item.code })));
  const paidIds = [...new Set(paidResults.flatMap((result) => (result.data ?? []).map((ad) => ad.id)))];
  const [campaignPeriods, contractPeriods] = paidIds.length
    ? await Promise.all([
      supabase.from('ad_campaigns').select('id, start_at, end_at').in('id', paidIds),
      supabase.from('ad_contracts').select('id, start_date, end_date').in('id', paidIds),
    ])
    : [{ data: [] }, { data: [] }];
  const campaignById = new Map((campaignPeriods.data ?? []).map((item) => [item.id, item]));
  const contractById = new Map((contractPeriods.data ?? []).map((item) => [item.id, item]));

  return campaignAdInventory.map((item, index) => ({
    code: item.code,
    name: item.name,
    desktop: item.desktop,
    mobile: item.mobile,
    paidAds: (paidResults[index]?.data ?? []).map((ad) => {
      const campaign = campaignById.get(ad.id);
      const contract = contractById.get(ad.id);
      return {
        id: ad.id,
        title: ad.title,
        startAt: campaign?.start_at ?? contract?.start_date ?? '',
        endAt: campaign?.end_at ?? contract?.end_date ?? null,
      };
    }),
    manualAds: manualAds.filter((ad) => ad.placement === item.code),
  }));
}
