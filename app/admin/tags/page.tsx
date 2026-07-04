import TagManager from '@/features/admin/TagManager';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminTagsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from('tags').select('id, name, slug').order('name');

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold text-title">Tags</h2>
      <TagManager tags={data ?? []} />
    </div>
  );
}
