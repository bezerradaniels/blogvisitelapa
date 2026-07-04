import ProsePage from '@/components/ProsePage';
import { siteConfig } from '@/lib/config/site';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({
  title: 'Termos de Uso',
  description: `Termos de uso do ${siteConfig.name}.`,
  path: '/termos-de-uso',
});

export default function TermosPage() {
  return (
    <ProsePage title="Termos de Uso">
      <p>
        Ao utilizar o {siteConfig.name}, você concorda com estes termos. Leia com atenção.
      </p>
      <h2>Uso do site</h2>
      <p>
        O conteúdo é disponibilizado para informação. É proibido reproduzir integralmente as
        matérias sem autorização e crédito.
      </p>
      <h2>Contas e conteúdo do usuário</h2>
      <p>
        Ao criar uma conta, você é responsável pelos comentários e conteúdos que envia. Comentários
        passam por moderação e podem ser removidos se violarem estes termos (ofensas, spam,
        desinformação ou conteúdo ilegal).
      </p>
      <h2>Publicidade</h2>
      <p>
        Anúncios e conteúdos patrocinados são identificados. A responsabilidade pelos produtos e
        serviços anunciados é dos respectivos anunciantes.
      </p>
      <h2>Alterações</h2>
      <p>Estes termos podem ser atualizados a qualquer momento, com publicação nesta página.</p>
    </ProsePage>
  );
}
