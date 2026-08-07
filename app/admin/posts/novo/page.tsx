import PostForm from '@/features/publisher/PostForm';
import AdminPageHeader from '@/components/AdminPageHeader';
import { listActiveCategories } from '@/features/publisher/queries';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({ title: 'Novo post', noindex: true });
export const dynamic = 'force-dynamic';

export default async function AdminNovoPostPage() {
  const categories = await listActiveCategories();
  return (
    <div className="space-y-4">
      <AdminPageHeader title="Adicionar novo post" description="Crie o conteúdo e defina as opções de publicação." />
      {/* Admin sempre pode publicar diretamente. */}
      <PostForm categories={categories} canPublish adminMode />
    </div>
  );
}
