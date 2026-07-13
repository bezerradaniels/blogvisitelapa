'use client';

// Navegação lateral do painel (tema "Jardim": fundo verde-escuro, item ativo menta).
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import Icon from '@/components/Icon';
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
  const router = useRouter();

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
        { href: '/admin/comercial', label: 'Visão comercial' },
        { href: '/admin/comercial/leads', label: 'Leads' },
        { href: '/admin/comercial/clientes', label: 'Clientes' },
        { href: '/admin/comercial/contratos', label: 'Contratos' },
        { href: '/admin/comercial/campanhas', label: 'Campanhas e publicidade' },
        { href: '/admin/comercial/conteudo', label: 'Conteúdo patrocinado' },
        { href: '/admin/comercial/produtos', label: 'Produtos e inventário' },
        { href: '/admin/comercial/financeiro', label: 'Financeiro' },
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
    if (href === '/admin' || href === '/admin/comercial') return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  // Seções recolhidas por padrão, exceto a que contém a página atual.
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const activeGroup = groups.find(
      (group) => group.title && group.items.some((item) => isActive(item.href)),
    );
    return new Set(activeGroup?.title ? [activeGroup.title] : []);
  });

  function toggleGroup(title: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }

  const currentMobileHref = groups
    .flatMap((group) => group.items)
    .find((item) => isActive(item.href))?.href ?? '/admin';

  return (
    <div className="flex h-full flex-col bg-title text-[#cfeede]">
      <div className="flex items-center gap-2 px-4 py-4">
        <span className="font-headline text-lg font-extrabold text-white">
          Conecta<span className="text-mint2">Lapa</span>
        </span>
        <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-white">admin</span>
      </div>

      <nav aria-label="Menu do painel" className="flex-1 space-y-4 overflow-y-auto px-3 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="lg:hidden">
          <label htmlFor="admin-mobile-navigation" className="sr-only">Navegação do painel</label>
          <select
            id="admin-mobile-navigation"
            value={currentMobileHref}
            onChange={(event) => router.push(event.target.value)}
            className="h-10 w-full rounded-[10px] border border-white/20 bg-white/10 px-3 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-mint2"
          >
            {groups.flatMap((group) => group.items.map((item) => (
              <option key={item.href} value={item.href} className="text-title">
                {group.title ? `${group.title} — ${item.label}` : item.label}
              </option>
            )))}
          </select>
        </div>
        <div className="hidden space-y-4 lg:block">
        {groups.map((group, gi) => {
          const collapsible = Boolean(group.title);
          const open = !collapsible || openGroups.has(group.title as string);
          const groupBadge = group.items.reduce((sum, item) => sum + (item.badge ?? 0), 0);
          return (
            <div key={gi} className="space-y-0.5">
              {group.title && (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.title as string)}
                  aria-expanded={open}
                  className="flex w-full items-center gap-1.5 rounded-[10px] px-2 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wide text-mint2 transition-colors hover:bg-white/5"
                >
                  <Icon
                    icon="ArrowRight01Icon"
                    size={14}
                    className={cn('shrink-0 transition-transform', open && 'rotate-90')}
                  />
                  <span className="flex-1 text-left">{group.title}</span>
                  {!open && groupBadge > 0 ? (
                    <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {groupBadge}
                    </span>
                  ) : null}
                </button>
              )}
              {open &&
                group.items.map((item) => {
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
          );
        })}
        </div>
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
