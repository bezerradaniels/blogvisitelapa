'use client';

// Menu mobile acessível (drawer) com botão hambúrguer.
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';
import { mainNav } from '@/lib/config/site';
import { createClient } from '@/lib/supabase/client';

interface MobileMenuProps {
  isAuthed?: boolean;
  accountHref?: string;
  accountLabel?: string;
}

export default function MobileMenu({
  isAuthed = false,
  accountHref = '/perfil',
  accountLabel = 'Meu perfil',
}: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Trava o scroll do body quando o drawer está aberto.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.push('/');
    router.refresh();
  }

  const linkClass = 'block rounded px-2 py-3 text-sm font-medium text-body hover:bg-surface';

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

      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Menu">
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
              {mainNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} onClick={() => setOpen(false)} className={linkClass}>
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
                  <button
                    type="button"
                    onClick={logout}
                    className="mt-1 rounded px-2 py-3 text-left text-sm font-medium text-danger hover:bg-surface"
                  >
                    Sair da conta
                  </button>
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
        </div>
      )}
    </div>
  );
}
