import 'server-only';

// Consultas de listagem para o painel admin (RLS: admin vê tudo).
import { createClient } from '@/lib/supabase/server';

export interface AdminPostRow {
  id: string;
  title: string;
  slug: string;
  status: string;
  moderation_status: string;
  is_featured: boolean;
  content_type: string;
  updated_at: string;
  author: { full_name: string | null } | null;
  category: { name: string } | null;
}

const POST_STATUS_FILTER: Record<string, string | undefined> = {
  pendentes: 'enviado_para_revisao',
  publicados: 'publicado',
  rascunhos: 'rascunho',
  arquivados: 'arquivado',
  removidos: 'removido',
};

export async function listAdminPosts(filter = 'todos', term = ''): Promise<AdminPostRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from('posts')
    .select(
      'id, title, slug, status, moderation_status, is_featured, content_type, updated_at, author:profiles!posts_author_id_fkey(full_name), category:categories(name)',
    )
    .order('updated_at', { ascending: false })
    .limit(100);

  const status = POST_STATUS_FILTER[filter];
  if (status) query = query.eq('status', status as 'publicado');
  if (filter === 'aprovacao') query = query.eq('moderation_status', 'pendente');
  if (term.trim()) query = query.ilike('title', `%${term.trim()}%`);

  const { data } = await query;
  return (data ?? []) as unknown as AdminPostRow[];
}

export interface AdminCommentRow {
  id: string;
  content: string;
  status: string;
  created_at: string;
  author: { full_name: string | null } | null;
  post: { title: string; slug: string } | null;
}

export async function listAdminComments(filter = 'pendentes'): Promise<AdminCommentRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from('comments')
    .select(
      'id, content, status, created_at, author:profiles!comments_user_id_fkey(full_name), post:posts(title, slug)',
    )
    .order('created_at', { ascending: false })
    .limit(100);

  if (filter !== 'todos') {
    const status = filter === 'pendentes' ? 'pendente' : filter;
    query = query.eq('status', status as 'pendente');
  }

  const { data } = await query;
  return (data ?? []) as unknown as AdminCommentRow[];
}
