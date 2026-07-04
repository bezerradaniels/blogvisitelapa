import { notFound } from 'next/navigation';
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
      <h2 className="text-base font-bold text-title">Editar post</h2>
      <PostForm categories={categories} initial={initial} canPublish />
    </div>
  );
}
