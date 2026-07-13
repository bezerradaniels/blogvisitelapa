import Image from 'next/image';
import AdTracker from '@/components/AdTracker';
import { getTopAd } from '@/lib/ads/resolver';
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
export default async function AdBanner({ placement, className, ratio = 'aspect-[16/5]' }: AdBannerProps) {
  const ad = await getTopAd(placement);
  if (!ad || !ad.banner_url) return null;

  const inner = (
    <div className={`relative w-full overflow-hidden rounded ${ratio} bg-surface`}>
      <Image
        src={ad.banner_url}
        alt={ad.company_name ? `Anúncio — ${ad.company_name}` : 'Anúncio'}
        fill
        sizes="(max-width:768px) 100vw, 728px"
        className="object-cover"
      />
    </div>
  );

  return (
    <div className={className}>
      <span className="mb-1 block text-[10px] uppercase tracking-wide text-muted">Publicidade</span>
      <AdTracker campaignId={ad.id} href={ad.link_url}>{inner}</AdTracker>
    </div>
  );
}
