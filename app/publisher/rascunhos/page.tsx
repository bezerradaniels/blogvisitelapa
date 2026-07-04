import PublisherPostsTable from '@/features/publisher/PublisherPostsTable';
import { getCurrentUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function RascunhosPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from('posts')
    .select('id, title, status, moderation_status, updated_at')
    .eq('author_id', user!.profile!.id)
    .eq('status', 'rascunho')
    .order('updated_at', { ascending: false });

  return <PublisherPostsTable posts={data ?? []} emptyTitle="Nenhum rascunho" />;
}
