// Chips de categoria (pílulas brancas com bolinha colorida à esquerda).
// Leve, com scroll-snap por CSS (sem dependências).
import Link from 'next/link';
import { listCarouselCategories } from '@/features/posts/queries';

// Cores das bolinhas, no espírito "Jardim".
const dotColors = [
  'var(--color-accent)',
  'var(--color-highlight)',
  'var(--color-brand)',
  'var(--color-mint-2)',
  'var(--color-title)',
];

export default async function CategoryCarousel() {
  const categories = await listCarouselCategories();
  if (categories.length === 0) return null;

  return (
    <section aria-label="Seções em destaque">
      <div className="snap-row no-scrollbar">
        {categories.map((cat, i) => (
          <Link
            key={cat.id}
            href={`/categorias/${cat.slug}`}
            className="flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2 text-sm font-bold text-title transition-colors hover:border-brand"
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: dotColors[i % dotColors.length] }}
              aria-hidden
            />
            {cat.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
