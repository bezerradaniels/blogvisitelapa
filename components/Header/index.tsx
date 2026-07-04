// Cabeçalho responsivo do site.
import Link from 'next/link';
import Button from '@/components/Button';
import Icon from '@/components/Icon';
import MobileMenu from '@/components/MobileMenu';
import { getCurrentUser } from '@/lib/auth/session';
import { mainNav, siteConfig } from '@/lib/config/site';

// Links de navegação exibidos no desktop (sem "Anuncie"/"Contato", que viram CTAs).
const desktopNav = mainNav.filter((i) => !['/anuncie', '/contato'].includes(i.href));

export default async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-card/95 backdrop-blur">
      <div className="container-page flex h-14 items-center justify-between gap-3">
        {/* Logo / nome */}
        <Link href="/" className="flex items-center gap-2" aria-label={siteConfig.name}>
          <span className="font-headline text-lg font-extrabold tracking-tight text-title">
            Visite<span className="text-brand">Lapa</span>
          </span>
        </Link>

        {/* Navegação desktop */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Navegação principal">
          {desktopNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded px-2.5 py-2 text-sm font-medium text-body hover:bg-surface hover:text-brand"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Ações */}
        <div className="flex items-center gap-1.5">
          <Link
            href="/busca"
            aria-label="Buscar"
            className="flex h-10 w-10 items-center justify-center rounded text-title hover:bg-surface"
          >
            <Icon icon="Search01Icon" size={20} />
          </Link>

          <div className="hidden md:block">
            <Button href="/anuncie" size="sm" variant="primary">
              Anuncie
            </Button>
          </div>

          {user ? (
            <Link
              href={user.isAdmin ? '/admin' : user.isPublisher ? '/publisher' : '/perfil'}
              aria-label="Minha conta"
              className="flex h-10 w-10 items-center justify-center rounded text-title hover:bg-surface"
            >
              <Icon icon="UserIcon" size={20} />
            </Link>
          ) : (
            <Link
              href="/login"
              className="hidden rounded px-2.5 py-2 text-sm font-medium text-body hover:text-brand md:inline-block"
            >
              Entrar
            </Link>
          )}

          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
