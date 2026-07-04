import ProsePage from '@/components/ProsePage';
import { siteConfig } from '@/lib/config/site';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({
  title: 'Política de Privacidade',
  description: `Como o ${siteConfig.name} trata os dados dos usuários.`,
  path: '/politica-de-privacidade',
});

export default function PrivacidadePage() {
  return (
    <ProsePage title="Política de Privacidade">
      <p>
        Esta política descreve como o {siteConfig.name} coleta e utiliza dados ao usar nosso site.
      </p>
      <h2>Dados que coletamos</h2>
      <ul>
        <li>Dados de cadastro (nome, e-mail) quando você cria uma conta.</li>
        <li>Conteúdo que você envia (comentários, avaliações, favoritos).</li>
        <li>Mensagens enviadas pelos formulários de contato.</li>
        <li>Dados de navegação e métricas de acesso agregadas.</li>
      </ul>
      <h2>Uso dos dados</h2>
      <p>
        Utilizamos os dados para operar o site, moderar conteúdo, responder contatos e melhorar a
        experiência. Não vendemos seus dados pessoais.
      </p>
      <h2>Publicidade</h2>
      <p>
        Podemos exibir anúncios, inclusive via Google AdSense, que podem usar cookies para
        personalização. Você pode gerenciar preferências de anúncios nas configurações do Google.
      </p>
      <h2>Seus direitos</h2>
      <p>
        Você pode solicitar acesso, correção ou exclusão dos seus dados pela{' '}
        <a href="/contato">página de contato</a>.
      </p>
    </ProsePage>
  );
}
