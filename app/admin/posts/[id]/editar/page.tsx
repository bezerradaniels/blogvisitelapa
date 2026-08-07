import { notFound } from 'next/navigation';
import AdminPageHeader from '@/components/AdminPageHeader';
import PostForm from '@/features/publisher/PostForm';
import { getPostForEdit, listActiveCategories } from '@/features/publisher/queries';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({ title: 'Editar post', noindex: true });
export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminEditarPostPage({ params }: Props) {
  const { id } = await params;
  const [initial, categories] = await Promise.all([getPostForEdit(id), listActiveCategories()]);
  if (!initial) notFound();

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title={initial.is_event ? 'Editar evento' : 'Editar post'}
        description={initial.is_event ? 'Atualize os dados, o conteúdo e as opções de publicação do evento.' : 'Atualize o conteúdo, a classificação e as opções editoriais.'}
      />
      <PostForm categories={categories} initial={initial} canPublish adminMode />
    </div>
  );
}
