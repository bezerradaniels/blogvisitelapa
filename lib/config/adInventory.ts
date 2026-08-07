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
  { code: 'post_inline_mobile', name: 'Artigo — topo mobile', location: 'Antes da trilha de navegação do artigo', pages: 'Todos os artigos', desktop: 'Não exibido', mobile: '728 × 90', capacity: 1, status: 'implemented' },
  { code: 'post_sidebar', name: 'Artigo/listagem — lateral', location: 'Início da coluna lateral direita', pages: 'Artigos e página “Artigos”', desktop: '300 × 300', mobile: 'Não exibido', capacity: 3, status: 'implemented' },
  { code: 'category_top', name: 'Listagens — topo', location: 'Entre o título da página e a grade/lista de artigos', pages: 'Artigos, categorias, tags, busca, eventos, guia local e seções personalizadas', desktop: '728 × 90', mobile: '320 × 100', capacity: 1, status: 'implemented' },
  { code: 'home_carousel', name: 'Home — carrossel', location: 'Carrossel publicitário da página inicial', pages: 'Página inicial', desktop: '1200 × 500', mobile: '320 × 320', capacity: 3, status: 'planned' },
  { code: 'event_sidebar', name: 'Evento — lateral', location: 'Coluna lateral da página de eventos', pages: 'Eventos', desktop: '300 × 300', mobile: 'Não definido', capacity: 2, status: 'planned' },
  { code: 'fixed_carousel_sponsor', name: 'Patrocínio do carrossel', location: 'Cota fixa de patrocínio do carrossel', pages: 'Página inicial', desktop: '300 × 300', mobile: '300 × 300', capacity: 1, status: 'planned' },
];

export function getAdInventoryItem(code: AdPlacement) {
  return adInventory.find((item) => item.code === code);
}
