'use client';

import Link from 'next/link';
import Icon from '@/components/Icon';
import { cn } from '@/lib/utils/cn';
import type { NewsFilterCategory } from '@/features/posts/NewsFilterSidebar';

export default function NewsFilterDisclosure({ categories, activeCategory }: { categories: NewsFilterCategory[]; activeCategory?: string }) {
  const activeLabel = categories.find((category) => category.slug === activeCategory)?.name ?? 'Todos os artigos';
  return <details className="card-base group overflow-hidden">
    <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 marker:hidden [&::-webkit-details-marker]:hidden">
      <span className="flex items-center gap-2 font-bold text-title"><Icon icon="FilterHorizontalIcon" size={19} className="text-brand" />Filtrar</span>
      <span className="flex min-w-0 items-center gap-2 text-sm text-muted"><span className="max-w-36 truncate">{activeLabel}</span><span className="text-xs transition-transform group-open:rotate-90" aria-hidden>▶</span></span>
    </summary>
    <nav aria-label="Filtrar artigos por categoria" className="max-h-[60vh] space-y-1 overflow-y-auto border-t border-line p-3">
      <Link href="/noticias" aria-current={!activeCategory ? 'page' : undefined} className={cn('flex min-h-10 items-center gap-2 px-3 text-sm font-bold', !activeCategory ? 'bg-brand-soft text-brand-dark' : 'text-body hover:bg-surface hover:text-brand')}><Icon icon="News01Icon" size={18} />Mais recentes</Link>
      {categories.map((category) => <Link key={category.id} href={`/noticias?categoria=${encodeURIComponent(category.slug)}`} aria-current={activeCategory === category.slug ? 'page' : undefined} className={cn('flex min-h-10 items-center gap-2 px-3 text-sm font-bold', activeCategory === category.slug ? 'bg-brand-soft text-brand-dark' : 'text-body hover:bg-surface hover:text-brand')}><Icon icon={category.icon_name ?? 'Tag01Icon'} size={18} />{category.name}</Link>)}
    </nav>
  </details>;
}
