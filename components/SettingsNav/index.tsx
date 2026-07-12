'use client';

// Navegação das Configurações: rolagem horizontal no mobile, coluna fixa (sticky)
// no desktop — mesmo padrão do SocialSidebarNav.
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/components/Icon';
import { SETTINGS_NAV } from '@/lib/settings/nav';
import { cn } from '@/lib/utils/cn';

export default function SettingsNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Seções das configurações"
      className="flex gap-2 overflow-x-auto p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:block lg:space-y-1 lg:overflow-visible lg:p-3"
    >
      {SETTINGS_NAV.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        if (!item.ready) {
          return (
            <span
              key={item.href}
              aria-disabled="true"
              title="Em breve"
              className="flex min-h-10 shrink-0 cursor-not-allowed items-center gap-2 rounded-full px-4 text-sm font-bold text-muted/60 lg:w-full lg:rounded-[10px] lg:px-3"
            >
              <Icon icon={item.icon} size={18} />
              <span className="whitespace-nowrap">{item.label}</span>
              <span className="ml-auto hidden rounded-full bg-surface px-2 py-0.5 text-[10px] font-semibold text-muted lg:inline">
                em breve
              </span>
            </span>
          );
        }
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex min-h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-bold transition-colors lg:w-full lg:rounded-[10px] lg:px-3',
              active
                ? 'bg-brand-soft text-brand-dark'
                : 'text-body hover:bg-surface hover:text-brand',
            )}
          >
            <Icon icon={item.icon} size={18} />
            <span className="whitespace-nowrap">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
