import Image from 'next/image';
import AdTracker from '@/components/AdTracker';
import AdPlaceholder from '@/components/AdPlaceholder';
import { getActiveAds } from '@/lib/ads/resolver';
import { getAdInventoryItem } from '@/lib/config/adInventory';
import type { AdPlacement } from '@/types/ads';

interface AdCardGridProps {
  placement: AdPlacement;
  limit?: number;
  className?: string;
}

// Cards de publicidade quadrados. Renderiza apenas contratos ativos, em ordem
// de prioridade, sem reservar espaço quando não há anúncio para a posição.
export default async function AdCardGrid({ placement, limit = 3, className }: AdCardGridProps) {
  const ads = (await getActiveAds(placement)).slice(0, limit);
  if (ads.length === 0) {
    const item = getAdInventoryItem(placement);
    return <section className={className} aria-label="Publicidade"><AdPlaceholder code={placement} name={item?.name ?? placement} dimensions={`${item?.desktop ?? '300 × 300'} · até ${limit} anúncios`} ratio="aspect-square" /></section>;
  }

  return (
    <section className={className} aria-label="Publicidade">
      <span className="mb-2 block text-[10px] uppercase tracking-wide text-muted">Publicidade</span>
      <div className="space-y-3">
        {ads.map((ad) => {
          const card = (
            <div className="relative aspect-square overflow-hidden rounded-[16px] bg-surface">
              <Image
                src={ad.banner_url!}
                alt={ad.company_name ? `Anúncio — ${ad.company_name}` : 'Anúncio'}
                fill
                sizes="280px"
                className="object-cover"
              />
            </div>
          );
          return <AdTracker key={ad.id} campaignId={ad.id} href={ad.link_url} className="block">{card}</AdTracker>;
        })}
      </div>
    </section>
  );
}
