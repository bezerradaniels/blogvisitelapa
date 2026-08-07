import AdminPageHeader from '@/components/AdminPageHeader';
import PostForm from '@/features/publisher/PostForm';
import { listActiveCategories } from '@/features/publisher/queries';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({ title: 'Novo evento', noindex: true });
export const dynamic = 'force-dynamic';

export default async function AdminNovoEventoPage() {
  const categories = await listActiveCategories();

  return (
    <div className="space-y-4">
      <AdminPageHeader title="Adicionar novo evento" description="Cadastre as informações, a programação e as opções de publicação do evento." />
      <PostForm categories={categories} canPublish adminMode eventMode />
    </div>
  );
}
