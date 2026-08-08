import Image from 'next/image';
import AdTracker from '@/components/AdTracker';
import AdPlaceholder from '@/components/AdPlaceholder';
import { getTopAd } from '@/lib/ads/resolver';
import { getAdDisplayClasses, getAdInventoryItem } from '@/lib/config/adInventory';
import type { AdPlacement } from '@/types/ads';

interface AdBannerProps {
  placement: AdPlacement;
  className?: string;
  // Proporção do espaço reservado (evita layout shift).
  ratio?: string;
}

// Banner de contrato manual. Server Component: só renderiza se houver anúncio
// válido para o placement (contrato ativo, no período e com criativo).
// Não exibe nada quando não há anúncio — sem espaços vazios na página.
export default async function AdBanner({ placement, className, ratio }: AdBannerProps) {
  const item = getAdInventoryItem(placement);
  const displayClasses = ratio ?? getAdDisplayClasses(placement);
  const ad = await getTopAd(placement);
  if (!ad || !ad.banner_url) {
    return <AdPlaceholder code={placement} name={item?.name ?? placement} dimensions={item?.desktop ?? '—'} mobileDimensions={item?.mobile} ratio={displayClasses} className={className} />;
  }

  const inner = (
    <div className={`relative overflow-hidden rounded ${displayClasses} bg-surface`}>
      <Image
        src={ad.banner_url}
        alt={ad.alternative_text || (ad.company_name ? `Anúncio — ${ad.company_name}` : 'Anúncio')}
        fill
        sizes="(max-width: 639px) 320px, 970px"
        className={ad.mobile_banner_url ? 'hidden object-cover sm:block' : 'object-cover'}
      />
      {ad.mobile_banner_url && <Image src={ad.mobile_banner_url} alt={ad.alternative_text || (ad.company_name ? `Anúncio — ${ad.company_name}` : 'Anúncio')} fill sizes="320px" className="object-cover sm:hidden" />}
    </div>
  );

  return (
    <div className={className}>
      <span className="mb-1 block text-[10px] uppercase tracking-wide text-muted">Publicidade</span>
      {ad.tracking_enabled === false
        ? (ad.link_url ? <a href={ad.link_url} target="_blank" rel="noopener sponsored nofollow">{inner}</a> : inner)
        : <AdTracker campaignId={ad.id} href={ad.link_url}>{inner}</AdTracker>}
    </div>
  );
}
