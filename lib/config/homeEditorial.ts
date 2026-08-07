export const homeEditorialAreas = [
  { key: 'hero', title: 'Hero', slug: 'sistema-home-hero', limit: 3, labels: ['Principal', 'Lateral superior', 'Lateral inferior'] },
  { key: 'featured', title: 'Artigos em destaque', slug: 'sistema-home-destaques', limit: 5, labels: ['Manchete', 'Chamada 1', 'Chamada 2', 'Chamada 3', 'Chamada 4'] },
  { key: 'secondary', title: 'Segunda área', slug: 'sistema-home-segunda-area', limit: 8, labels: ['Card 1', 'Relacionado 1', 'Card 2', 'Relacionado 2', 'Card 3', 'Relacionado 3', 'Card 4', 'Relacionado 4'] },
] as const;

export type HomeEditorialAreaKey = (typeof homeEditorialAreas)[number]['key'];
export type HomeEditorialSlot = `${HomeEditorialAreaKey}:${number}`;
export const systemHomeSectionSlugs = homeEditorialAreas.map((area) => area.slug);

export function parseHomeEditorialSlot(slot?: string | null) {
  if (!slot) return null;
  const [key, rawIndex] = slot.split(':');
  const area = homeEditorialAreas.find((item) => item.key === key);
  const index = Number(rawIndex);
  return area && Number.isInteger(index) && index >= 0 && index < area.limit ? { area, index } : null;
}
