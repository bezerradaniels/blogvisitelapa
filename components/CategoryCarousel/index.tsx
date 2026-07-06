// Carrossel de seções em destaque: cards com imagem de fundo.
// Mobile: rolagem lateral com scroll-snap. Desktop: grade que exibe tudo.
// Sem imagem (image_url nulo): fallback com cor de marca + ícone da categoria.
import Image from 'next/image';
import Link from 'next/link';
import Icon from '@/components/Icon';
import { listCarouselCategories } from '@/features/posts/queries';

// Cores de fundo do fallback, no espírito "Jardim".
const fallbackColors = [
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
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 no-scrollbar md:grid md:grid-cols-5 md:overflow-visible">
        {categories.map((cat, i) => (
          <Link
            key={cat.id}
            href={`/categorias/${cat.slug}`}
            className="group relative aspect-[3/4] w-[150px] flex-none snap-start overflow-hidden rounded-xl md:w-auto"
          >
            {cat.image_url ? (
              <Image
                src={cat.image_url}
                alt={cat.name}
                fill
                sizes="(max-width: 768px) 150px, 20vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div
                className="absolute inset-0"
                style={{ background: fallbackColors[i % fallbackColors.length] }}
                aria-hidden
              />
            )}

            {/* Ícone da categoria (destaque no fallback, sutil sobre a foto) */}
            <Icon
              icon={cat.icon_name ?? 'Tag01Icon'}
              size={40}
              strokeWidth={1.6}
              className={`absolute left-1/2 top-[36%] -translate-x-1/2 -translate-y-1/2 ${
                cat.image_url ? 'text-white/60' : 'text-white/90'
              }`}
            />

            {/* Sombreado inferior para legibilidade do texto */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

            {/* Nome + chamada */}
            <div className="absolute inset-x-0 bottom-0 p-3">
              <p className="font-headline text-base font-extrabold leading-tight text-white drop-shadow-sm">
                {cat.name}
              </p>
              <span className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-white/85">
                Ver seção
                <Icon
                  icon="ArrowRight01Icon"
                  size={13}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
