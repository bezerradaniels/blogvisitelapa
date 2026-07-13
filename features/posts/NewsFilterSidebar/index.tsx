'use client';

import Link from 'next/link';
import Icon from '@/components/Icon';
import { cn } from '@/lib/utils/cn';

export interface NewsFilterCategory {
  id: string;
  name: string;
  slug: string;
  icon_name: string | null;
}

interface NewsFilterSidebarProps {
  categories: NewsFilterCategory[];
  activeCategory?: string;
}

export default function NewsFilterSidebar({ categories, activeCategory }: NewsFilterSidebarProps) {
  return (
    <aside className="lg:sticky lg:top-20 lg:h-fit">
      <div className="card-base overflow-hidden">
        <nav
          aria-label="Filtrar notícias por categoria"
          className="flex gap-2 overflow-x-auto p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:block lg:space-y-1 lg:overflow-visible lg:p-3"
        >
          <Link
            href="/noticias"
            aria-current={!activeCategory ? 'page' : undefined}
            className={cn(
              'flex min-h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-bold transition-colors lg:w-full lg:rounded-[10px] lg:px-3',
              !activeCategory ? 'bg-brand-soft text-brand-dark' : 'text-body hover:bg-surface hover:text-brand',
            )}
          >
            <Icon icon="News01Icon" size={18} />
            <span className="whitespace-nowrap">Mais recentes</span>
          </Link>
          {categories.map((category) => {
            const active = activeCategory === category.slug;
            return (
              <Link
                key={category.id}
                href={`/noticias?categoria=${encodeURIComponent(category.slug)}`}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-bold transition-colors lg:w-full lg:rounded-[10px] lg:px-3',
                  active ? 'bg-brand-soft text-brand-dark' : 'text-body hover:bg-surface hover:text-brand',
                )}
              >
                <Icon icon={category.icon_name ?? 'Tag01Icon'} size={18} />
                <span className="whitespace-nowrap">{category.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
