import PostForm from '@/features/publisher/PostForm';
import { listActiveCategories } from '@/features/publisher/queries';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({ title: 'Novo post', noindex: true });
export const dynamic = 'force-dynamic';

export default async function AdminNovoPostPage() {
  const categories = await listActiveCategories();
  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold text-title">Novo post</h2>
      {/* Admin sempre pode publicar diretamente. */}
      <PostForm categories={categories} canPublish />
    </div>
  );
}
