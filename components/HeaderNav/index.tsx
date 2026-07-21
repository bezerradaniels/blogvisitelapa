'use client';

// Navegação desktop em pílulas, com destaque do item ativo.
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/components/Icon';
import { cn } from '@/lib/utils/cn';

interface NavItem {
  label: string;
  href: string;
  icon?: string;
  iconClassName?: string;
}

export default function HeaderNav({ items }: { items: readonly NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-1 md:flex" aria-label="Navegação principal">
      {items.map((item) => {
        const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold transition-colors',
              active ? 'bg-slate-100 text-title' : 'text-body hover:bg-surface hover:text-brand',
            )}
          >
            {item.icon && <Icon icon={item.icon} size={18} className={item.iconClassName} />}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
