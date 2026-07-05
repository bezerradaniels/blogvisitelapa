import SponsoredManager from '@/features/admin/SponsoredManager';
import { createClient } from '@/lib/supabase/server';
import type { PostWithRelations } from '@/types/posts';

export const dynamic = 'force-dynamic';

interface SponsoredRow {
  id: string;
  label: string;
  is_active: boolean;
  created_at: string;
  post: { title: string; slug: string } | null;
}

export default async function AdminPublieditoriaisPage() {
  const supabase = await createClient();
  const [{ data: posts }, { data: entries }] = await Promise.all([
    supabase.from('posts').select('id, title, slug').order('created_at', { ascending: false }).limit(200),
    supabase
      .from('sponsored_articles')
      .select('id, label, is_active, created_at, post:posts(title, slug)')
      .order('created_at', { ascending: false }),
  ]);

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold text-title">Publieditoriais (conteúdo patrocinado)</h2>
      <SponsoredManager
        kind="article"
        posts={(posts ?? []) as Pick<PostWithRelations, 'id' | 'title' | 'slug'>[]}
        entries={(entries ?? []) as unknown as SponsoredRow[]}
      />
    </div>
  );
}
