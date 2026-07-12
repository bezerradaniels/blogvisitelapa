'use client';

// Navegação lateral do painel (tema "Jardim": fundo verde-escuro, item ativo menta).
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';
import { cn } from '@/lib/utils/cn';

interface LinkItem {
  href: string;
  label: string;
  badge?: number;
}

interface Group {
  title?: string;
  items: LinkItem[];
}

interface AdminSidebarProps {
  pendingComments?: number;
  userName?: string;
  userRole?: string;
  openReports?: number;
}

export default function AdminSidebar({
  pendingComments = 0,
  openReports = 0,
  userName,
  userRole,
}: AdminSidebarProps) {
  const pathname = usePathname();

  const groups: Group[] = [
    {
      items: [
        { href: '/admin', label: 'Visão geral' },
        { href: '/admin/posts', label: 'Posts' },
        { href: '/admin/categorias', label: 'Categorias' },
        { href: '/admin/tags', label: 'Tags' },
        { href: '/admin/secoes-home', label: 'Seções da homepage' },
        { href: '/admin/comentarios', label: 'Comentários', badge: pendingComments || undefined },
        { href: '/admin/avaliacoes', label: 'Avaliações' },
        { href: '/admin/contatos', label: 'Contatos' },
      ],
    },
    {
      title: 'Comunidade',
      items: [
        { href: '/admin/comunidades', label: 'Comunidades' },
        { href: '/admin/denuncias', label: 'Denúncias', badge: openReports || undefined },
      ],
    },
    {
      title: 'Comercial',
      items: [
        { href: '/admin/anunciantes', label: 'Anunciantes' },
        { href: '/admin/clientes-comerciais', label: 'Clientes' },
        { href: '/admin/publicidade', label: 'Publicidade' },
        { href: '/admin/contratos', label: 'Contratos' },
        { href: '/admin/publieditoriais', label: 'Publieditoriais' },
        { href: '/admin/eventos-patrocinados', label: 'Eventos patrocinados' },
        { href: '/admin/produtos-avulsos', label: 'Produtos avulsos' },
      ],
    },
    {
      title: 'Sistema',
      items: [
        { href: '/admin/usuarios', label: 'Usuários' },
        { href: '/admin/configuracoes', label: 'Configurações' },
        { href: '/admin/auditoria', label: 'Auditoria' },
      ],
    },
  ];

  function isActive(href: string) {
    return href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
  }

  return (
    <div className="flex h-full flex-col bg-title text-[#cfeede]">
      <div className="flex items-center gap-2 px-4 py-4">
        <span className="font-headline text-lg font-extrabold text-white">
          Conecta<span className="text-mint2">Lapa</span>
        </span>
        <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-white">admin</span>
      </div>

      <nav aria-label="Menu do painel" className="flex-1 space-y-4 overflow-y-auto px-3 pb-4">
        {groups.map((group, gi) => (
          <div key={gi} className="space-y-0.5">
            {group.title && (
              <p className="px-2 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wide text-mint2">
                {group.title}
              </p>
            )}
            {group.items.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-2 rounded-[14px] px-3 py-2 text-sm font-semibold transition-colors',
                    active ? 'bg-brand font-extrabold text-white' : 'text-white hover:bg-white/10',
                  )}
                >
                  <span
                    className={cn('h-2 w-2 shrink-0 rounded-full', active ? 'bg-white' : 'bg-mint2/60')}
                    aria-hidden
                  />
                  <span className="flex-1">{item.label}</span>
                  {item.badge ? (
                    <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {userName && (
        <div className="m-3 rounded-[14px] bg-white/5 p-2">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-mint2 text-sm font-extrabold text-title">
              {userName.charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-white">{userName}</span>
              <span className="block text-[11px] text-[#8fc4ab]">{userRole}</span>
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2 border-t border-white/10 pt-2">
            <Link
              href="/conta/senha"
              className="flex-1 rounded-[10px] px-2 py-1.5 text-center text-xs font-semibold text-[#cfeede] hover:bg-white/10"
            >
              Alterar senha
            </Link>
            <LogoutButton className="flex-1 rounded-[10px] px-2 py-1.5 text-center text-xs font-semibold text-white hover:bg-accent/80 bg-accent/60">
              Sair
            </LogoutButton>
          </div>
        </div>
      )}
    </div>
  );
}
