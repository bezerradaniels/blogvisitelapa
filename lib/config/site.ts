// Configuração central do Visite Lapa.
// Identidade, geografia local e navegação em um único lugar (base para SEO/GEO).

export const siteConfig = {
  name: 'Visite Lapa',
  shortName: 'Visite Lapa',
  slogan: 'Tudo sobre Bom Jesus da Lapa',
  description:
    'Notícias, eventos, turismo, religiosidade e guia local de Bom Jesus da Lapa, na Bahia. ' +
    'Cobertura da cidade do Senhor Bom Jesus, no Vale do São Francisco, oeste baiano.',
  locale: 'pt-BR',
  // Geografia (base para GEO / local SEO / schema)
  geo: {
    city: 'Bom Jesus da Lapa',
    state: 'Bahia',
    stateCode: 'BA',
    region: 'Oeste da Bahia',
    subregion: 'Vale do São Francisco',
    country: 'Brasil',
    countryCode: 'BR',
    latitude: -13.2551,
    longitude: -43.4184,
  },
  // Contatos institucionais
  contact: {
    email: 'contato@visitelapa.com.br',
    whatsapp: '',
  },
  social: {
    instagram: '',
    facebook: '',
    youtube: '',
  },
} as const;

// URL base do site (sem barra final). Usa a env em produção.
export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  return url.replace(/\/$/, '');
}

// Monta uma URL absoluta a partir de um caminho relativo.
export function absoluteUrl(path = '/'): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${getSiteUrl()}${clean}`;
}

// Navegação principal (header e menu mobile).
export const mainNav = [
  { label: 'Início', href: '/' },
  { label: 'Notícias', href: '/noticias' },
  { label: 'Eventos', href: '/eventos' },
  { label: 'Onde Comer', href: '/onde-comer' },
  { label: 'Onde Malhar', href: '/onde-malhar' },
  { label: 'Hospedagem', href: '/hospedagem' },
  { label: 'Religiosidade', href: '/religiosidade' },
  { label: 'Anuncie', href: '/anuncie' },
  { label: 'Contato', href: '/contato' },
] as const;

// Rodapé — links institucionais e de confiança editorial.
export const footerNav = {
  institucional: [
    { label: 'Sobre', href: '/sobre' },
    { label: 'Política editorial', href: '/politica-editorial' },
    { label: 'Política de privacidade', href: '/politica-de-privacidade' },
    { label: 'Termos de uso', href: '/termos-de-uso' },
  ],
  secoes: [
    { label: 'Notícias', href: '/noticias' },
    { label: 'Eventos', href: '/eventos' },
    { label: 'Turismo', href: '/categorias/turismo' },
    { label: 'Guia Local', href: '/categorias/guia-local' },
  ],
  contato: [
    { label: 'Fale conosco', href: '/contato' },
    { label: 'Anuncie', href: '/anuncie' },
  ],
} as const;
