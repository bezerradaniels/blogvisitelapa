// Cabeçalho responsivo do site.
import Link from 'next/link';
import Button from '@/components/Button';
import HeaderNav from '@/components/HeaderNav';
import Icon from '@/components/Icon';
import MobileMenu from '@/components/MobileMenu';
import { countUnread } from '@/features/notifications/queries';
import { getCurrentUser } from '@/lib/auth/session';
import { mainNav, siteConfig } from '@/lib/config/site';

// Links de navegação exibidos no desktop (sem "Anuncie"/"Contato", que viram CTAs).
const desktopNav = mainNav.filter((i) => !['/anuncie', '/contato'].includes(i.href));

export default async function Header() {
  const user = await getCurrentUser();
  const unread = user?.profile ? await countUnread(user.profile.id) : 0;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-card/95 backdrop-blur">
      <div className="container-page flex h-[68px] items-center justify-between gap-3">
        {/* Logo / nome */}
        <Link href="/" className="flex items-center gap-2" aria-label={siteConfig.name}>
          <span className="font-headline text-xl font-extrabold tracking-tight text-title">
            Visite<span className="text-brand">Lapa</span>
          </span>
        </Link>

        {/* Navegação desktop */}
        <HeaderNav items={desktopNav} />

        {/* Ações */}
        <div className="flex items-center gap-2">
          <Link
            href="/busca"
            aria-label="Buscar"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-title hover:bg-brand-soft"
          >
            <Icon icon="Search01Icon" size={20} />
          </Link>

          <div className="hidden md:block">
            <Button href="/anuncie" size="sm" variant="accent">
              Anuncie
            </Button>
          </div>

          {user ? (
            <>
              <Link
                href="/mensagens"
                aria-label="Mensagens"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-title hover:bg-brand-soft"
              >
                <Icon icon="Mail01Icon" size={20} />
              </Link>
              <Link
                href="/notificacoes"
                aria-label="Notificações"
                className="relative flex h-10 w-10 items-center justify-center rounded-full bg-surface text-title hover:bg-brand-soft"
              >
                <Icon icon="Notification03Icon" size={20} />
                {unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </Link>
              <Link
                href={user.isAdmin ? '/admin' : user.isPublisher ? '/publisher' : '/perfil'}
                aria-label="Minha conta"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-title hover:bg-brand-soft"
              >
                <Icon icon="UserIcon" size={20} />
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              className="hidden rounded-full px-3 py-2 text-sm font-bold text-body hover:text-brand md:inline-block"
            >
              Entrar
            </Link>
          )}

          <MobileMenu
            isAuthed={Boolean(user)}
            accountHref={user?.isAdmin ? '/admin' : user?.isPublisher ? '/publisher' : '/perfil'}
            accountLabel={user?.isAdmin ? 'Painel admin' : user?.isPublisher ? 'Meu painel' : 'Meu perfil'}
          />
        </div>
      </div>
    </header>
  );
}
