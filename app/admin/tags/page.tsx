import TagManager from '@/features/admin/TagManager';
import AdminPageHeader from '@/components/AdminPageHeader';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminTagsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from('tags').select('id, name, slug').order('name');

  return (
    <div className="admin-page space-y-4">
      <AdminPageHeader title="Tags" description="Gerencie os termos não hierárquicos usados para relacionar conteúdos." />
      <TagManager tags={data ?? []} />
    </div>
  );
}
