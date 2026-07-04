import ContactForm from '@/features/contacts/ContactForm';
import { siteConfig } from '@/lib/config/site';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({
  title: 'Contato',
  description: `Fale com o ${siteConfig.name}: sugestões, correções, pautas e dúvidas.`,
  path: '/contato',
});

export default function ContatoPage() {
  return (
    <div className="container-page max-w-2xl py-8">
      <h1 className="text-2xl font-extrabold text-title md:text-3xl">Fale conosco</h1>
      <p className="mt-2 text-sm text-muted">
        Envie sugestões de pauta, correções, dúvidas ou qualquer mensagem para a nossa equipe.
      </p>
      <div className="mt-6">
        <ContactForm />
      </div>
    </div>
  );
}
