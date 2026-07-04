// View reutilizável de listagem (seções, categorias, tags, busca).
import AdBanner from '@/components/AdBanner';
import EmptyState from '@/components/EmptyState';
import PostCard from '@/components/PostCard';
import type { AdPlacement } from '@/types/ads';
import type { PostWithRelations } from '@/types/posts';

interface ListingViewProps {
  title: string;
  description?: string;
  posts: PostWithRelations[];
  adPlacement?: AdPlacement;
  emptyTitle?: string;
}

export default function ListingView({
  title,
  description,
  posts,
  adPlacement = 'category_top',
  emptyTitle = 'Nenhum conteúdo encontrado',
}: ListingViewProps) {
  return (
    <div className="container-page space-y-6 py-6">
      <header className="space-y-1">
        <h1 className="text-xl font-extrabold text-title md:text-2xl">{title}</h1>
        {description && <p className="max-w-2xl text-sm text-muted">{description}</p>}
      </header>

      <AdBanner placement={adPlacement} />

      {posts.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <EmptyState title={emptyTitle} description="Novos conteúdos serão publicados em breve." />
      )}
    </div>
  );
}
