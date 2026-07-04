// Carrossel fixo de seções (Onde comer, Onde malhar, Eventos, Hospedagem, Religiosidade).
// Leve, com scroll-snap por CSS (sem dependências).
import Link from 'next/link';
import Icon from '@/components/Icon';
import { listCarouselCategories } from '@/features/posts/queries';

export default async function CategoryCarousel() {
  const categories = await listCarouselCategories();
  if (categories.length === 0) return null;

  return (
    <section aria-label="Seções em destaque">
      <div className="snap-row no-scrollbar">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/categorias/${cat.slug}`}
            className="card-base flex w-40 flex-col gap-2 p-3 transition-colors hover:border-brand sm:w-48"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded bg-brand-soft text-brand-dark">
              <Icon icon={cat.icon_name ?? 'Tag01Icon'} size={20} />
            </span>
            <span className="text-sm font-bold text-title">{cat.name}</span>
            {cat.description && (
              <span className="line-clamp-2 text-xs text-muted">{cat.description}</span>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
