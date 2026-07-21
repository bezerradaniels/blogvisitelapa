'use client';

// Menu mobile acessível (drawer) com botão hambúrguer.
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from '@/components/Icon';
import LogoutButton from '@/components/LogoutButton';

interface NavItem {
  label: string;
  href: string;
  icon?: string;
  iconClassName?: string;
}

interface MobileMenuProps {
  items: readonly NavItem[];
  isAuthed?: boolean;
  accountHref?: string;
  accountLabel?: string;
}

export default function MobileMenu({
  items,
  isAuthed = false,
  accountHref = '/perfil',
  accountLabel = 'Meu perfil',
}: MobileMenuProps) {
  const [open, setOpen] = useState(false);

  // Trava o scroll do body quando o drawer está aberto.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const linkClass = 'flex items-center gap-2 rounded px-2 py-3 text-sm font-medium text-body hover:bg-surface';

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center rounded text-title"
      >
        <Icon icon="Menu01Icon" size={24} />
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Menu">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <nav className="absolute right-0 top-0 flex h-full w-72 max-w-[80%] flex-col overflow-y-auto bg-card p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-headline text-lg font-bold text-title">Menu</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar menu"
                className="flex h-9 w-9 items-center justify-center rounded text-title"
              >
                <Icon icon="Cancel01Icon" size={22} />
              </button>
            </div>

            <ul className="flex flex-col">
              {items.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} onClick={() => setOpen(false)} className={linkClass}>
                    {item.icon && <Icon icon={item.icon} size={18} className={item.iconClassName} />}
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Ações de conta — antes ausentes no mobile. */}
            <div className="mt-4 flex flex-col border-t border-line pt-4">
              {isAuthed ? (
                <>
                  <Link href={accountHref} onClick={() => setOpen(false)} className={linkClass}>
                    {accountLabel}
                  </Link>
                  <Link href="/mensagens" onClick={() => setOpen(false)} className={linkClass}>
                    Mensagens
                  </Link>
                  <Link href="/notificacoes" onClick={() => setOpen(false)} className={linkClass}>
                    Notificações
                  </Link>
                  <Link href="/configuracoes" onClick={() => setOpen(false)} className={linkClass}>
                    Configurações e privacidade
                  </Link>
                  <Link href="/conta/senha" onClick={() => setOpen(false)} className={linkClass}>
                    Alterar senha
                  </Link>
                  <LogoutButton
                    onDone={() => setOpen(false)}
                    className="mt-1 rounded px-2 py-3 text-left text-sm font-medium text-danger hover:bg-surface"
                  />
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="rounded-full bg-brand px-4 py-2.5 text-center text-sm font-bold text-white hover:bg-brand-dark"
                  >
                    Entrar
                  </Link>
                  <Link
                    href="/cadastro"
                    onClick={() => setOpen(false)}
                    className="mt-2 rounded-full border border-line px-4 py-2.5 text-center text-sm font-bold text-body hover:bg-surface"
                  >
                    Criar conta
                  </Link>
                </>
              )}
            </div>
          </nav>
          </div>,
          document.body,
        )}
    </div>
  );
}
