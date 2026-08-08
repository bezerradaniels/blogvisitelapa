import type { AdPlacement } from '@/types/ads';

export interface AdInventoryItem {
  code: AdPlacement | 'home_editorial_portrait';
  name: string;
  location: string;
  pages: string;
  desktop: string;
  mobile: string;
  capacity: number;
  status: 'implemented' | 'placeholder' | 'planned';
}

export const adInventory: AdInventoryItem[] = [
  { code: 'home_editorial_portrait', name: 'Home — retrato editorial', location: 'Ao lado da seleção de artigos, logo após o hero', pages: 'Página inicial', desktop: '1080 × 1350 (4:5)', mobile: 'Ocupa a largura disponível', capacity: 1, status: 'placeholder' },
  { code: 'home_top', name: 'Home — topo', location: 'Após as categorias e antes de “Últimos artigos”', pages: 'Página inicial', desktop: '728 × 90', mobile: '320 × 50', capacity: 1, status: 'implemented' },
  { code: 'home_middle', name: 'Home — meio', location: 'Após “Últimos artigos” e antes de “Próximos eventos”', pages: 'Página inicial', desktop: '728 × 90', mobile: '320 × 100', capacity: 1, status: 'implemented' },
  { code: 'post_inline_mobile', name: 'Artigo — topo mobile', location: 'Antes da trilha de navegação do artigo', pages: 'Todos os artigos', desktop: 'Não exibido', mobile: '320 × 100', capacity: 1, status: 'implemented' },
  { code: 'post_sidebar', name: 'Artigo/listagem — lateral', location: 'Início da coluna lateral direita', pages: 'Artigos e página “Artigos”', desktop: '300 × 300', mobile: 'Não exibido', capacity: 3, status: 'implemented' },
  { code: 'category_top', name: 'Listagens — topo', location: 'Entre o título da página e a grade/lista de artigos', pages: 'Artigos, categorias, tags, busca, eventos, guia local e seções personalizadas', desktop: '970 × 250', mobile: '320 × 100', capacity: 1, status: 'implemented' },
  { code: 'home_carousel', name: 'Home — carrossel', location: 'Carrossel publicitário da página inicial', pages: 'Página inicial', desktop: '1200 × 500', mobile: '320 × 320', capacity: 3, status: 'planned' },
  { code: 'event_sidebar', name: 'Evento — lateral', location: 'Coluna lateral da página de eventos', pages: 'Eventos', desktop: '300 × 300', mobile: 'Não definido', capacity: 2, status: 'planned' },
  { code: 'fixed_carousel_sponsor', name: 'Patrocínio do carrossel', location: 'Cota fixa de patrocínio do carrossel', pages: 'Página inicial', desktop: '300 × 300', mobile: '300 × 300', capacity: 1, status: 'planned' },
];

export function getAdInventoryItem(code: AdPlacement) {
  return adInventory.find((item) => item.code === code);
}

export const campaignAdInventory = adInventory.filter(
  (item): item is AdInventoryItem & { code: AdPlacement } => item.code !== 'home_editorial_portrait',
);

export function getAdUploadRatio(code: AdPlacement, device: 'desktop' | 'mobile') {
  if (code === 'post_sidebar' || code === 'event_sidebar' || code === 'fixed_carousel_sponsor') return 'aspect-square';
  if (code === 'home_carousel') return device === 'desktop' ? 'aspect-[12/5]' : 'aspect-square';
  if (code === 'category_top') return device === 'desktop' ? 'aspect-[970/250]' : 'aspect-[320/100]';
  if (code === 'home_top') return device === 'desktop' ? 'aspect-[728/90]' : 'aspect-[320/50]';
  if (code === 'home_middle') return device === 'desktop' ? 'aspect-[728/90]' : 'aspect-[320/100]';
  return 'aspect-[320/100]';
}

export function supportsAdDevice(code: AdPlacement, device: 'desktop' | 'mobile') {
  const item = getAdInventoryItem(code);
  const dimensions = device === 'desktop' ? item?.desktop : item?.mobile;
  return Boolean(dimensions && !dimensions.toLowerCase().startsWith('não'));
}

// Classes estáticas para o Tailwind preservar a proporção real de cada mídia.
export function getAdDisplayClasses(code: AdPlacement) {
  switch (code) {
    case 'home_top':
      return 'mx-auto aspect-[320/50] w-full max-w-[320px] sm:aspect-[728/90] sm:max-w-[728px]';
    case 'home_middle':
      return 'mx-auto aspect-[320/100] w-full max-w-[320px] sm:aspect-[728/90] sm:max-w-[728px]';
    case 'category_top':
      return 'mx-auto aspect-[320/100] w-full max-w-[320px] sm:aspect-[970/250] sm:max-w-[970px]';
    case 'post_inline_mobile':
      return 'mx-auto aspect-[320/100] w-full max-w-[320px]';
    case 'home_carousel':
      return 'mx-auto aspect-square w-full max-w-[320px] sm:aspect-[12/5] sm:max-w-[1200px]';
    case 'post_sidebar':
    case 'event_sidebar':
    case 'fixed_carousel_sponsor':
      return 'mx-auto aspect-square w-full max-w-[300px]';
    default:
      return 'mx-auto aspect-[320/100] w-full max-w-[320px] sm:aspect-[728/90] sm:max-w-[728px]';
  }
}
