import ProsePage from '@/components/ProsePage';
import { siteConfig } from '@/lib/config/site';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({
  title: 'Política de Cookies',
  description: `Como o ${siteConfig.name} usa cookies e como você pode gerenciar o consentimento.`,
  path: '/politica-de-cookies',
});

export default function CookiesPage() {
  return (
    <ProsePage title="Política de Cookies">
      <p>
        Esta política explica o que são cookies, como o {siteConfig.name} os utiliza e como você
        pode gerenciar suas preferências, em linha com a Lei Geral de Proteção de Dados (LGPD).
      </p>

      <h2>O que são cookies</h2>
      <p>
        Cookies são pequenos arquivos gravados no seu navegador quando você acessa um site. Eles
        permitem, por exemplo, manter você conectado e entender como as páginas são utilizadas.
      </p>

      <h2>Cookies que utilizamos</h2>
      <ul>
        <li>
          <strong>Essenciais:</strong> necessários para o funcionamento do site, como manter sua
          sessão de login. Não podem ser desativados.
        </li>
        <li>
          <strong>Analíticos:</strong> nos ajudam a entender, de forma agregada, como o site é
          usado, para melhorar a experiência. Só são ativados com o seu consentimento.
        </li>
        <li>
          <strong>Publicidade:</strong> quando exibimos anúncios (inclusive via Google AdSense),
          parceiros podem usar cookies para medir e personalizar anúncios. Só são ativados com o seu
          consentimento.
        </li>
      </ul>

      <h2>Gerenciar seu consentimento</h2>
      <p>
        Ao acessar o site pela primeira vez, exibimos um aviso para você aceitar ou recusar os
        cookies não essenciais. Você pode alterar sua escolha a qualquer momento limpando os dados
        do site no seu navegador, o que fará o aviso aparecer novamente. Também é possível bloquear
        ou apagar cookies diretamente nas configurações do seu navegador.
      </p>

      <h2>Mais informações</h2>
      <p>
        Para saber como tratamos seus dados pessoais, consulte a nossa{' '}
        <a href="/politica-de-privacidade">Política de Privacidade</a>. Dúvidas podem ser enviadas
        pela <a href="/contato">página de contato</a>.
      </p>
    </ProsePage>
  );
}
