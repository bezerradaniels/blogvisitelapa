import Image from 'next/image';
import Link from 'next/link';
import Badge from '@/components/Badge';
import { formatDate } from '@/lib/utils/format';
import type { PostWithRelations } from '@/types/posts';

interface PostCardProps {
  post: PostWithRelations;
  variant?: 'default' | 'compact' | 'featured';
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
export default function PostCard({ post, variant = 'default' }: PostCardProps) {
  const href = `/post/${post.slug}`;
  const date = post.published_at ?? post.created_at;
  const isFeatured = variant === 'featured';
  const isCompact = variant === 'compact';

  return (
    <article className="group card-base card-hover overflow-hidden">
      <Link href={href} className="block">
        <div className={`relative ${isCompact ? 'aspect-[16/10]' : 'aspect-[16/10]'} bg-surface`}>
          {post.cover_image_url ? (
            <Image
              src={post.cover_image_url}
              alt={post.cover_image_alt ?? post.title}
              fill
              sizes={isFeatured ? '(max-width:768px) 100vw, 66vw' : '(max-width:768px) 100vw, 33vw'}
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

      <div className={isCompact ? 'p-3' : 'p-4'}>
        <Link href={href}>
          <h3
            className={`font-bold text-title group-hover:text-brand ${
              isFeatured ? 'text-lg md:text-2xl' : 'text-sm md:text-base'
            } line-clamp-3`}
          >
            {post.title}
          </h3>
        </Link>
        {!isCompact && post.subtitle && (
          <p className="mt-1 line-clamp-2 text-xs text-muted md:text-sm">{post.subtitle}</p>
        )}
        <div className="mt-2 flex items-center gap-2 text-xs text-muted">
          {post.author?.full_name && <span>{post.author.full_name}</span>}
          {post.author?.full_name && <span aria-hidden>·</span>}
          <time dateTime={date}>{formatDate(date)}</time>
        </div>
      </div>
    </article>
  );
}
