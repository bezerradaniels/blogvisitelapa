import 'server-only';

// Consultas de engajamento para a página de post.
import { createClient } from '@/lib/supabase/server';
import type { CommentWithAuthor } from '@/types/posts';

// Comentários aprovados de um post (com autor).
export async function listApprovedComments(postId: string): Promise<CommentWithAuthor[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('comments')
    .select('*, author:profiles!comments_user_id_fkey(full_name, avatar_url, slug)')
    .eq('post_id', postId)
    .eq('status', 'aprovado')
    .order('created_at', { ascending: false });
  return (data ?? []) as unknown as CommentWithAuthor[];
}

// Estado do usuário atual em relação ao post (favorito, nota).
export async function getUserPostState(postId: string, profileId: string | null) {
  if (!profileId) return { favorited: false, userRating: null as number | null };
  const supabase = await createClient();
  const [{ data: fav }, { data: rating }] = await Promise.all([
    supabase.from('favorites').select('id').eq('post_id', postId).eq('user_id', profileId).maybeSingle(),
    supabase.from('ratings').select('rating').eq('post_id', postId).eq('user_id', profileId).maybeSingle(),
  ]);
  return { favorited: Boolean(fav), userRating: rating?.rating ?? null };
}
