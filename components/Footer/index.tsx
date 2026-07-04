// Rodapé com links institucionais e de confiança editorial.
import Link from 'next/link';
import { footerNav, siteConfig } from '@/lib/config/site';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t border-line bg-card">
      <div className="container-page grid grid-cols-2 gap-6 py-8 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <span className="font-headline text-lg font-extrabold text-title">
            Visite<span className="text-brand">Lapa</span>
          </span>
          <p className="mt-2 text-xs text-muted">
            {siteConfig.slogan}. Notícias, eventos e guia local de {siteConfig.geo.city},{' '}
            {siteConfig.geo.stateCode}.
          </p>
        </div>

        <nav aria-label="Seções">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Seções</h3>
          <ul className="space-y-1.5">
            {footerNav.secoes.map((i) => (
              <li key={i.href}>
                <Link href={i.href} className="text-sm text-body hover:text-brand">
                  {i.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Institucional">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Institucional</h3>
          <ul className="space-y-1.5">
            {footerNav.institucional.map((i) => (
              <li key={i.href}>
                <Link href={i.href} className="text-sm text-body hover:text-brand">
                  {i.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Contato">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Contato</h3>
          <ul className="space-y-1.5">
            {footerNav.contato.map((i) => (
              <li key={i.href}>
                <Link href={i.href} className="text-sm text-body hover:text-brand">
                  {i.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-line py-4">
        <p className="container-page text-center text-xs text-muted">
          © {year} {siteConfig.name}. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
