'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
  const [open, setOpen] = useState(false);
  const activeLabel = categories.find((category) => category.slug === activeCategory)?.name ?? 'Mais recentes';

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const categoryLinks = (mobile = false) => (
    <>
      <Link
        href="/noticias"
        aria-current={!activeCategory ? 'page' : undefined}
        onClick={mobile ? () => setOpen(false) : undefined}
        className={cn(
          mobile
            ? 'flex min-h-12 items-center gap-3 rounded-[10px] px-3 text-base font-bold transition-colors'
            : 'flex min-h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-bold transition-colors lg:w-full lg:rounded-[10px] lg:px-3',
          !activeCategory ? 'bg-brand-soft text-brand-dark' : 'text-body hover:bg-surface hover:text-brand',
        )}
      >
        <Icon icon="News01Icon" size={mobile ? 20 : 18} />
        <span>Mais recentes</span>
      </Link>
      {categories.map((category) => {
        const active = activeCategory === category.slug;
        return (
          <Link
            key={category.id}
            href={`/noticias?categoria=${encodeURIComponent(category.slug)}`}
            aria-current={active ? 'page' : undefined}
            onClick={mobile ? () => setOpen(false) : undefined}
            className={cn(
              mobile
                ? 'flex min-h-12 items-center gap-3 rounded-[10px] px-3 text-base font-bold transition-colors'
                : 'flex min-h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-bold transition-colors lg:w-full lg:rounded-[10px] lg:px-3',
              active ? 'bg-brand-soft text-brand-dark' : 'text-body hover:bg-surface hover:text-brand',
            )}
          >
            <Icon icon={category.icon_name ?? 'Tag01Icon'} size={mobile ? 20 : 18} />
            <span>{category.name}</span>
          </Link>
        );
      })}
    </>
  );

  return (
    <aside className="min-w-0 lg:sticky lg:top-20 lg:h-fit">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="news-categories-sidebar"
        className="card-base flex min-h-12 w-full items-center justify-between gap-3 px-4 text-left lg:hidden"
      >
        <span className="flex min-w-0 items-center gap-2 font-bold text-title">
          <Icon icon="News01Icon" size={20} className="shrink-0 text-brand" />
          <span className="truncate">{activeLabel}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1 text-sm font-bold text-brand">
          Categorias
          <Icon icon="ArrowRight01Icon" size={18} />
        </span>
      </button>

      <div className="card-base hidden overflow-hidden lg:block">
        <nav
          aria-label="Filtrar notícias por categoria"
          className="space-y-1 p-3"
        >
          {categoryLinks()}
        </nav>
      </div>

      {open && createPortal(
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Categorias de notícias">
          <button type="button" aria-label="Fechar categorias" className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <section id="news-categories-sidebar" className="absolute right-0 top-0 flex h-full w-80 max-w-[86vw] flex-col bg-card p-4 shadow-xl">
            <header className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-title">Categorias</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fechar categorias" className="flex h-10 w-10 items-center justify-center rounded-full text-title hover:bg-surface">
                <Icon icon="Cancel01Icon" size={22} />
              </button>
            </header>
            <nav aria-label="Filtrar notícias por categoria" className="flex flex-col gap-1 overflow-y-auto">
              {categoryLinks(true)}
            </nav>
          </section>
        </div>,
        document.body,
      )}
    </aside>
  );
}
