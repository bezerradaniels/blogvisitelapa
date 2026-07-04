import ProsePage from '@/components/ProsePage';
import { siteConfig } from '@/lib/config/site';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({
  title: 'Política Editorial',
  description: `Como o ${siteConfig.name} produz, seleciona e identifica seu conteúdo.`,
  path: '/politica-editorial',
});

export default function PoliticaEditorialPage() {
  return (
    <ProsePage title="Política Editorial">
      <p>
        Esta página explica como o {siteConfig.name} produz e seleciona seu conteúdo, e como
        distinguimos jornalismo de publicidade.
      </p>

      <h2>Cobertura</h2>
      <p>
        Publicamos notícias, eventos, turismo, religiosidade e guias locais de {siteConfig.geo.city}
        {' '}e região. Priorizamos assuntos de interesse público local, com relevância para moradores,
        visitantes e romeiros.
      </p>

      <h2>Como selecionamos as notícias</h2>
      <p>
        A pauta é definida pela relevância local, atualidade e utilidade para a comunidade. Buscamos
        apurar informações junto a fontes confiáveis e identificar a origem quando aplicável.
      </p>

      <h2>Correções</h2>
      <p>
        Erros podem acontecer. Para solicitar uma correção, entre em contato pela nossa{' '}
        <a href="/contato">página de contato</a> indicando o link da matéria e a informação a ser
        corrigida. Avaliamos e corrigimos o mais rápido possível, registrando a atualização.
      </p>

      <h2>Conteúdo patrocinado e publicidade</h2>
      <p>
        Conteúdos comerciais são sempre identificados com rótulos como{' '}
        <strong>“Conteúdo patrocinado”</strong>, <strong>“Publieditorial”</strong> ou{' '}
        <strong>“Evento patrocinado”</strong>. Eles não se confundem, visual ou semanticamente, com o
        conteúdo jornalístico independente.
      </p>

      <h2>Contato editorial</h2>
      <p>
        Sugestões de pauta, dúvidas e correções podem ser enviadas pela{' '}
        <a href="/contato">página de contato</a>.
      </p>
    </ProsePage>
  );
}
