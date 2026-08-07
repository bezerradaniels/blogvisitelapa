export const portalSections = [
  { value: 'onde-comer', label: 'Onde Comer' },
  { value: 'onde-malhar', label: 'Onde Malhar' },
  { value: 'hospedagem', label: 'Hospedagem' },
  { value: 'religiosidade', label: 'Religiosidade' },
] as const;

export type PortalSection = (typeof portalSections)[number]['value'];

export const portalSectionTag = (section: PortalSection) => `secao-${section}`;
export const portalSectionTagName = (section: PortalSection) => `Seção: ${portalSections.find((item) => item.value === section)?.label ?? section}`;

export function isPortalSectionTag(slug: string) {
  return portalSections.some((section) => portalSectionTag(section.value) === slug);
}
