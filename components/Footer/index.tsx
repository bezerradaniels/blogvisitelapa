// Rodapé com links institucionais e de confiança editorial.
import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';
import { footerNav, siteConfig } from '@/lib/config/site';

export default function Footer() {
  const year = new Date().getFullYear();

  const linkClass = 'text-sm text-white hover:text-mint2';
  const headClass = 'mb-2 text-xs font-bold uppercase tracking-wide text-mint2';

  return (
    <footer className="shrink-0 bg-title text-[#bfe8d3]">
      <div className="container-page grid grid-cols-2 gap-6 py-10 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <BrandLogo inverted />
          <p className="mt-2 text-xs text-white">
            {siteConfig.slogan}. Notícias, eventos e guia local de {siteConfig.geo.city},{' '}
            {siteConfig.geo.stateCode}.
          </p>
        </div>

        <nav aria-label="Seções">
          <h3 className={headClass}>Seções</h3>
          <ul className="space-y-1.5">
            {footerNav.secoes.map((i) => (
              <li key={i.href}>
                <Link href={i.href} className={linkClass}>
                  {i.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Institucional">
          <h3 className={headClass}>Institucional</h3>
          <ul className="space-y-1.5">
            {footerNav.institucional.map((i) => (
              <li key={i.href}>
                <Link href={i.href} className={linkClass}>
                  {i.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Contato">
          <h3 className={headClass}>Contato</h3>
          <ul className="space-y-1.5">
            {footerNav.contato.map((i) => (
              <li key={i.href}>
                <Link href={i.href} className={linkClass}>
                  {i.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-white/10 py-4">
        <p className="container-page text-center text-xs text-white">
          © {year} {siteConfig.name}. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
