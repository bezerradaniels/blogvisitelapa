// View reutilizável de listagem (seções, categorias, tags, busca).
import AdBanner from '@/components/AdBanner';
import EmptyState from '@/components/EmptyState';
import PostCard from '@/components/PostCard';
import type { ReactNode } from 'react';
import type { AdPlacement } from '@/types/ads';
import type { PostWithRelations } from '@/types/posts';

interface ListingViewProps {
  title: string;
  description?: string;
  posts: PostWithRelations[];
  adPlacement?: AdPlacement;
  emptyTitle?: string;
  sidebar?: ReactNode;
  rightSidebar?: ReactNode;
  headerAction?: ReactNode;
  showSubtitles?: boolean;
  cardVariant?: 'default' | 'news-list';
}

export default function ListingView({
  title,
  description,
  posts,
  adPlacement = 'category_top',
  emptyTitle = 'Nenhum conteúdo encontrado',
  sidebar,
  rightSidebar,
  headerAction,
  showSubtitles = true,
  cardVariant = 'default',
}: ListingViewProps) {
  return (
    <div className="container-page space-y-6 py-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-extrabold text-title md:text-2xl">{title}</h1>
          {description && <p className="max-w-2xl text-sm text-muted">{description}</p>}
        </div>
        {headerAction}
      </header>

      <div className={sidebar || rightSidebar ? `grid min-w-0 gap-5 ${sidebar && rightSidebar ? 'lg:grid-cols-[260px_minmax(0,1fr)_280px]' : sidebar ? 'lg:grid-cols-[260px_1fr]' : 'lg:grid-cols-[minmax(0,1fr)_280px]'}` : undefined}>
        {sidebar}
        <div className="min-w-0 space-y-6">
          <AdBanner placement={adPlacement} />

          {posts.length > 0 ? (
            <div className={cardVariant === 'news-list' ? 'grid gap-3' : 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'}>
              {posts.map((post) => (
                <PostCard key={post.id} post={post} variant={cardVariant} showSubtitle={showSubtitles} />
              ))}
            </div>
          ) : (
            <EmptyState title={emptyTitle} description="Novos conteúdos serão publicados em breve." />
          )}
        </div>
        {rightSidebar}
      </div>
    </div>
  );
}
