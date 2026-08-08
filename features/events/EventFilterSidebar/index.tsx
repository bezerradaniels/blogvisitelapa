import Link from 'next/link';
import Icon from '@/components/Icon';
import type { NewsFilterCategory } from '@/features/posts/NewsFilterSidebar';
import type { EventPeriod } from '@/features/posts/queries';

interface EventFilterSidebarProps {
  categories: NewsFilterCategory[];
  activePeriod?: EventPeriod;
  activeCategory?: string;
  location?: string;
}

export default function EventFilterSidebar({ categories, activePeriod, activeCategory, location }: EventFilterSidebarProps) {
  const hasFilters = Boolean(activePeriod || activeCategory || location);

  return (
    <aside className="card-base h-fit p-4 lg:sticky lg:top-20">
      <div className="mb-4 flex items-center gap-2">
        <Icon icon="FilterHorizontalIcon" size={20} className="text-brand" />
        <h2 className="text-lg font-extrabold text-title">Filtrar eventos</h2>
      </div>

      <form action="/eventos" className="space-y-4">
        <label className="block space-y-1.5 text-sm font-bold text-title">
          <span>Quando</span>
          <select name="periodo" defaultValue={activePeriod ?? ''} className="input-base min-h-11 w-full">
            <option value="">Próximos eventos</option>
            <option value="today">Hoje</option>
            <option value="weekend">Neste fim de semana</option>
            <option value="7-days">Próximos 7 dias</option>
            <option value="30-days">Próximos 30 dias</option>
          </select>
        </label>

        <label className="block space-y-1.5 text-sm font-bold text-title">
          <span>Categoria</span>
          <select name="categoria" defaultValue={activeCategory ?? ''} className="input-base min-h-11 w-full">
            <option value="">Todas as categorias</option>
            {categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}
          </select>
        </label>

        <label className="block space-y-1.5 text-sm font-bold text-title">
          <span>Local</span>
          <input name="local" defaultValue={location ?? ''} placeholder="Digite um local" className="input-base min-h-11 w-full" />
        </label>

        <button type="submit" className="min-h-11 w-full bg-brand px-4 text-sm font-bold text-white hover:bg-brand-dark">
          Aplicar filtros
        </button>
        {hasFilters && <Link href="/eventos" className="block text-center text-sm font-bold text-brand hover:underline">Limpar filtros</Link>}
      </form>
    </aside>
  );
}
