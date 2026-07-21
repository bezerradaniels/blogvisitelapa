// Textos otimizados (GEO / local SEO) das landing pages de seção.
// Cada entrada vira H1, título e descrição de SEO da respectiva rota.
import { siteConfig } from './site';

const city = siteConfig.geo.city;
const uf = siteConfig.geo.stateCode;

export interface LandingConfig {
  slug: string; // slug da categoria correspondente
  h1: string;
  seoTitle: string;
  seoDescription: string;
  intro: string;
}

export const sectionLandings: Record<string, LandingConfig> = {
  noticias: {
    slug: 'noticias',
    h1: `Notícias de ${city}`,
    seoTitle: `Notícias de ${city} (${uf})`,
    seoDescription: `As últimas notícias de ${city}, no Vale do São Francisco, oeste da Bahia. Política, comunidade, cultura e cotidiano da cidade.`,
    intro: `Acompanhe as principais notícias de ${city} e região, com apuração local e atualização constante.`,
  },
  eventos: {
    slug: 'eventos',
    h1: `Eventos em ${city} e região`,
    seoTitle: `Eventos em ${city} (${uf}) — agenda cultural e religiosa`,
    seoDescription: `Agenda de eventos em ${city}: shows, festas, romarias, feiras e programação cultural da cidade.`,
    intro: `Confira a agenda de eventos em ${city}, do religioso ao cultural, tudo o que vai acontecer na cidade.`,
  },
  'onde-comer': {
    slug: 'onde-comer',
    h1: `Onde comer em ${city}`,
    seoTitle: `Onde comer em ${city} (${uf}) — restaurantes e bares`,
    seoDescription: `Guia de onde comer em ${city}: restaurantes, bares, lanchonetes e a gastronomia típica do São Francisco.`,
    intro: `Descubra os melhores lugares para comer em ${city}, da comida regional aos novos points da cidade.`,
  },
  'onde-malhar': {
    slug: 'onde-malhar',
    h1: `Onde malhar em ${city}`,
    seoTitle: `Onde malhar em ${city} (${uf}) — academias e estúdios`,
    seoDescription: `Academias, estúdios e opções de atividade física em ${city}. Encontre onde treinar na cidade.`,
    intro: `Veja onde malhar em ${city}: academias, crossfit, estúdios e espaços para se exercitar.`,
  },
  hospedagem: {
    slug: 'hospedagem',
    h1: `Hospedagem em ${city}`,
    seoTitle: `Hospedagem em ${city} (${uf}) — hotéis e pousadas`,
    seoDescription: `Onde ficar em ${city}: hotéis, pousadas e opções de hospedagem para turistas e romeiros.`,
    intro: `Encontre a melhor hospedagem em ${city} para a sua visita ou romaria — hotéis e pousadas na cidade.`,
  },
  religiosidade: {
    slug: 'religiosidade',
    h1: `Religiosidade em ${city}`,
    seoTitle: `Religiosidade em ${city} (${uf}) — romarias e o Santuário`,
    seoDescription: `Fé e turismo religioso em ${city}: o Santuário do Senhor Bom Jesus, romarias e a tradição do povo.`,
    intro: `Conheça a religiosidade de ${city}, terra do Senhor Bom Jesus, e a devoção que move milhares de romeiros.`,
  },
  turismo: {
    slug: 'turismo',
    h1: `Turismo em ${city}`,
    seoTitle: `Turismo em ${city} (${uf}) — o que fazer e pontos turísticos`,
    seoDescription: `Turismo em ${city}: pontos turísticos, o Morro do Santuário, o Rio São Francisco e roteiros pela cidade.`,
    intro: `Planeje sua visita a ${city} com nosso guia de turismo: atrações, natureza e cultura do oeste baiano.`,
  },
  'guia-local': {
    slug: 'guia-local',
    h1: `Guia local de ${city}`,
    seoTitle: `Guia local de ${city} (${uf}) — serviços e comércio`,
    seoDescription: `Guia de serviços e comércio de ${city}: onde comer, onde ficar, onde malhar e o que a cidade oferece.`,
    intro: `O guia completo de ${city} para moradores e visitantes: serviços, comércio e dicas locais.`,
  },
};
