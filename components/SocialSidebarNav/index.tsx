'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

export interface SocialNavItem {
  href: string;
  label: string;
  count?: number;
}

export default function SocialSidebarNav({ items }: { items: SocialNavItem[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Áreas da rede social" className="space-y-1 p-3">
      {items.map((item) => {
        const active = item.href === '/rede' ? pathname === '/rede' : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex min-h-10 items-center rounded-[10px] px-3 text-sm font-bold transition-colors',
              active ? 'bg-brand-soft text-brand-dark' : 'text-body hover:bg-surface hover:text-brand',
            )}
          >
            {item.label}
            {typeof item.count === 'number' && <span className="ml-auto text-xs text-muted">{item.count}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
