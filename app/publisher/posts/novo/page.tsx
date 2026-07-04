import PostForm from '@/features/publisher/PostForm';
import { listActiveCategories } from '@/features/publisher/queries';
import { getCurrentUser } from '@/lib/auth/session';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({ title: 'Novo post', path: '/publisher/posts/novo', noindex: true });
export const dynamic = 'force-dynamic';

export default async function NovoPostPage() {
  const [categories, user] = await Promise.all([listActiveCategories(), getCurrentUser()]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-title">Novo post</h2>
      <PostForm categories={categories} canPublish={Boolean(user?.isPublisher)} />
    </div>
  );
}
