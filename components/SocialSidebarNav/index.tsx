'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

export interface SocialNavItem {
  href: string;
  label: string;
  count?: number;
  exact?: boolean;
}

export default function SocialSidebarNav({ items }: { items: SocialNavItem[] }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Áreas da rede social"
      className="flex gap-2 overflow-x-auto p-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:block lg:space-y-1 lg:overflow-visible lg:p-4"
    >
      {items.map((item) => {
        const active = item.exact || item.href === '/rede'
          ? pathname === item.href
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex min-h-9 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-bold transition-colors lg:min-h-10 lg:w-full lg:rounded-[10px] lg:px-3',
              active ? 'bg-brand-soft text-brand-dark' : 'text-body hover:bg-surface hover:text-brand',
            )}
          >
            {item.label}
            {typeof item.count === 'number' && <span className="text-xs font-semibold text-muted lg:ml-auto">{item.count}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
