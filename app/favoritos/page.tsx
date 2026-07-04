import { redirect } from 'next/navigation';
import EmptyState from '@/components/EmptyState';
import PostCard from '@/components/PostCard';
import Button from '@/components/Button';
import { getCurrentUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { buildMetadata } from '@/lib/seo/metadata';
import type { PostWithRelations } from '@/types/posts';

export const metadata = buildMetadata({ title: 'Meus favoritos', path: '/favoritos', noindex: true });

export default async function FavoritosPage() {
  const user = await getCurrentUser();
  if (!user?.profile) redirect('/login?redirect=/favoritos');

  const supabase = await createClient();
  const { data } = await supabase
    .from('favorites')
    .select(
      'post:posts(*, category:categories(id, name, slug, icon_name), author:profiles!posts_author_id_fkey(id, full_name, slug, avatar_url, role, bio))',
    )
    .eq('user_id', user.profile.id)
    .order('created_at', { ascending: false });

  const posts = ((data ?? []) as unknown as { post: PostWithRelations | null }[])
    .map((row) => row.post)
    .filter((p): p is PostWithRelations => Boolean(p));

  return (
    <div className="container-page py-8">
      <h1 className="mb-6 text-2xl font-extrabold text-title">Meus favoritos</h1>
      {posts.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Você ainda não salvou nada"
          description="Toque em “Salvar nos favoritos” em qualquer matéria para guardá-la aqui."
          action={<Button href="/noticias">Explorar notícias</Button>}
        />
      )}
    </div>
  );
}
