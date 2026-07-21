import Image from 'next/image';
import Link from 'next/link';
import Badge from '@/components/Badge';
import type { PostWithRelations } from '@/types/posts';

interface PostCardProps {
  post: PostWithRelations;
  variant?: 'default' | 'compact' | 'featured' | 'hero-featured' | 'hero-side' | 'mobile-horizontal' | 'news-list';
  showSubtitle?: boolean;
}

// Cor do selo de categoria conforme o tema "Jardim".
type BadgeTone = 'accent' | 'highlight' | 'brand';
function categoryTone(slug?: string | null): BadgeTone {
  if (slug === 'eventos') return 'accent';
  if (slug && ['onde-comer', 'onde-malhar', 'hospedagem', 'guia-local'].includes(slug)) {
    return 'highlight';
  }
  return 'brand';
}

// Card de post reutilizável (listagens, home, relacionados).
export default function PostCard({ post, variant = 'default', showSubtitle = true }: PostCardProps) {
  const href = `/post/${post.slug}`;
  const isFeatured = variant === 'featured' || variant === 'hero-featured';
  const isCompact = variant === 'compact';
  const isHeroFeatured = variant === 'hero-featured';
  const isHeroSide = variant === 'hero-side';
  const isMobileHorizontal = variant === 'mobile-horizontal';
  const isNewsList = variant === 'news-list';

  return (
    <article className={`group card-base card-hover min-w-0 overflow-hidden ${isHeroFeatured || isHeroSide ? 'flex h-full flex-col' : ''} ${isMobileHorizontal ? 'flex sm:block' : ''} ${isNewsList ? 'flex' : ''}`}>
      <Link href={href} className={`block ${isHeroFeatured || isHeroSide ? 'min-h-0 flex-1' : ''} ${isMobileHorizontal ? 'h-28 w-28 shrink-0 sm:h-auto sm:w-auto' : ''} ${isNewsList ? 'h-32 w-32 shrink-0' : ''}`}>
        <div className={`relative bg-surface ${isHeroFeatured || isHeroSide ? 'h-full aspect-[16/10] lg:aspect-auto' : isMobileHorizontal ? 'h-full aspect-auto sm:h-auto sm:aspect-[16/10]' : isNewsList ? 'h-full' : 'h-52 sm:h-auto sm:aspect-[16/10]'}`}>
          {post.cover_image_url ? (
            <Image
              src={post.cover_image_url}
              alt={post.cover_image_alt ?? post.title}
              fill
              sizes={isNewsList ? '128px' : isFeatured ? '(max-width:768px) 100vw, 66vw' : '(max-width:768px) 100vw, 33vw'}
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              priority={isFeatured}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted">Sem imagem</div>
          )}
          <div className="absolute left-2 top-2 flex gap-1">
            {post.category && (
              <Badge tone={categoryTone(post.category.slug)}>{post.category.name}</Badge>
            )}
            {post.is_sponsored && <Badge tone="sponsored">Patrocinado</Badge>}
          </div>
        </div>
      </Link>

      <div className={`${isCompact || isHeroSide ? 'p-3' : 'p-4'} ${isMobileHorizontal ? 'min-w-0 flex-1 p-3 sm:p-4' : ''} ${isNewsList ? 'flex min-w-0 flex-1 items-center p-4 sm:p-5' : ''}`}>
        <Link href={href} className="block min-w-0">
          <h3
            className={`font-bold text-title group-hover:text-brand md:!text-slate-800 ${
              isHeroFeatured ? 'text-lg md:text-2xl' : isFeatured ? 'text-lg md:text-2xl' : isNewsList ? 'text-base md:text-lg' : 'text-sm md:text-base'
            } break-words whitespace-normal line-clamp-3`}
          >
            {post.title}
          </h3>
        </Link>
        {showSubtitle && !isCompact && !isHeroSide && post.subtitle && (
          <p className={`mt-1 line-clamp-2 text-xs text-muted md:text-sm ${isMobileHorizontal ? 'hidden sm:block' : ''}`}>{post.subtitle}</p>
        )}
      </div>
    </article>
  );
}
