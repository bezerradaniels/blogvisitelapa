// llms.txt — descreve o site para sistemas de IA (em português).
import { absoluteUrl, siteConfig } from '@/lib/config/site';

export const revalidate = 86400;

export function GET() {
  const body = `# ${siteConfig.name}

> ${siteConfig.slogan}. Portal independente de artigos, eventos e conteúdo local sobre ${siteConfig.geo.city}, ${siteConfig.geo.state} (${siteConfig.geo.region}, ${siteConfig.geo.subregion}).

## Sobre
${siteConfig.name} publica artigos e eventos sobre ${siteConfig.geo.city} e região, incluindo turismo, religiosidade, onde comer, onde malhar, hospedagem e serviços.

## Cidade coberta
${siteConfig.geo.city} — ${siteConfig.geo.state} — Brasil.

## Principais seções
- Artigos: ${absoluteUrl('/noticias')}
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
- RSS de artigos: ${absoluteUrl('/feed/noticias')}
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
