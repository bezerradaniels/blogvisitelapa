import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import SettingsNav from '@/components/SettingsNav';
import { getCurrentUser } from '@/lib/auth/session';

// Layout de duas colunas: navegação persistente (sticky no desktop) + conteúdo.
// Auth centralizada aqui: sem sessão, volta para o login da rede social.
export default async function ConfiguracoesLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user?.profile) redirect('/login-rede-social?redirect=/configuracoes');

  return (
    <div className="container-page py-6 sm:py-8">
      <nav
        aria-label="Trilha"
        className="mb-4 flex flex-wrap items-center gap-1.5 text-xs font-semibold text-muted"
      >
        <Link href="/" className="hover:text-brand">
          Início
        </Link>
        <span aria-hidden>›</span>
        <Link href="/configuracoes" className="hover:text-brand">
          Configurações
        </Link>
      </nav>

      <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:h-fit">
          <div className="card-base overflow-hidden">
            <SettingsNav />
          </div>
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
