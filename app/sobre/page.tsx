import ProsePage from '@/components/ProsePage';
import { siteConfig } from '@/lib/config/site';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({
  title: 'Sobre o Conecta Lapa',
  description: `Conheça o ${siteConfig.name}, portal de notícias e guia local de ${siteConfig.geo.city}.`,
  path: '/sobre',
});

export default function SobrePage() {
  return (
    <ProsePage title="Sobre o Conecta Lapa">
      <p>
        O <strong>{siteConfig.name}</strong> é um portal independente de notícias, eventos e guia
        local dedicado a {siteConfig.geo.city}, no {siteConfig.geo.subregion}, {siteConfig.geo.region}.
      </p>
      <p>
        Nossa missão é informar moradores, visitantes e romeiros com conteúdo local, original e
        atual — do noticiário do dia a dia à agenda cultural e religiosa da cidade do Senhor Bom
        Jesus, além de um guia prático de onde comer, onde malhar e onde se hospedar.
      </p>
      <h2>O que cobrimos</h2>
      <ul>
        <li>Notícias de {siteConfig.geo.city} e região</li>
        <li>Eventos, festas e romarias</li>
        <li>Turismo e religiosidade</li>
        <li>Guia local: gastronomia, hospedagem, serviços e comunidade</li>
      </ul>
      <h2>Independência</h2>
      <p>
        Somos um veículo independente, sem vínculo com outros portais ou plataformas. Conteúdo
        publicitário é sempre claramente identificado e separado do conteúdo jornalístico.
      </p>
    </ProsePage>
  );
}
