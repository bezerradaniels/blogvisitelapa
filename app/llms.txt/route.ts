// llms.txt — descreve o site para sistemas de IA (em português).
import { absoluteUrl, siteConfig } from '@/lib/config/site';

export const revalidate = 86400;

export function GET() {
  const body = `# ${siteConfig.name}

> ${siteConfig.slogan}. Portal independente de notícias, eventos e guia local de ${siteConfig.geo.city}, ${siteConfig.geo.state} (${siteConfig.geo.region}, ${siteConfig.geo.subregion}).

## Sobre
${siteConfig.name} é um veículo de mídia local que cobre ${siteConfig.geo.city} e região: notícias, eventos, turismo, religiosidade e um guia da cidade (onde comer, onde malhar, hospedagem e serviços).

## Cidade coberta
${siteConfig.geo.city} — ${siteConfig.geo.state} — Brasil.

## Principais seções
- Notícias: ${absoluteUrl('/noticias')}
- Eventos: ${absoluteUrl('/eventos')}
- Turismo: ${absoluteUrl('/categorias/turismo')}
- Religiosidade: ${absoluteUrl('/religiosidade')}
- Onde comer: ${absoluteUrl('/onde-comer')}
- Onde malhar: ${absoluteUrl('/onde-malhar')}
- Hospedagem: ${absoluteUrl('/hospedagem')}
- Guia local: ${absoluteUrl('/categorias/guia-local')}

## Propósito editorial
Informar moradores, visitantes, romeiros e empresas com conteúdo local, original e atual. Conteúdo publicitário é sempre identificado (Conteúdo patrocinado, Publieditorial, Evento patrocinado) e separado do conteúdo jornalístico.

## Links úteis
- Sobre: ${absoluteUrl('/sobre')}
- Política editorial: ${absoluteUrl('/politica-editorial')}
- Contato: ${absoluteUrl('/contato')}
- Anuncie: ${absoluteUrl('/anuncie')}
- RSS: ${absoluteUrl('/rss.xml')}
- RSS de notícias: ${absoluteUrl('/feed/noticias')}
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
