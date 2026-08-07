import 'server-only';

// Consultas de listagem para o painel admin (RLS: admin vê tudo).
import { createClient } from '@/lib/supabase/server';
import type { ModerationStatus, PostStatus } from '@/types/database';

export interface AdminPostRow {
  id: string;
  title: string;
  slug: string;
  status: string;
  moderation_status: string;
  is_featured: boolean;
  content_type: string;
  updated_at: string;
  published_at: string | null;
  author_id: string;
  author: { full_name: string | null } | null;
  category: { id: string; name: string } | null;
}

const POST_STATUS_FILTER: Record<string, string | undefined> = {
  pendentes: 'enviado_para_revisao',
  publicados: 'publicado',
  rascunhos: 'rascunho',
  arquivados: 'arquivado',
  removidos: 'removido',
};

export interface AdminPostFilters {
  filter?: string;
  term?: string;
  authorId?: string;
  categoryId?: string;
  month?: string;
  page?: number;
  pageSize?: number;
}

export interface AdminPostListResult {
  posts: AdminPostRow[];
  count: number;
  page: number;
  pageSize: number;
}

export async function listAdminPosts({
  filter = 'todos', term = '', authorId = '', categoryId = '', month = '', page = 1, pageSize = 20,
}: AdminPostFilters = {}): Promise<AdminPostListResult> {
  const supabase = await createClient();
  let query = supabase
    .from('posts')
    .select(
      'id, title, slug, status, moderation_status, is_featured, content_type, updated_at, published_at, author_id, author:profiles!posts_author_id_fkey(full_name), category:categories(id, name)',
      { count: 'exact' },
    )
    .order('updated_at', { ascending: false });

  const status = POST_STATUS_FILTER[filter];
  if (status) query = query.eq('status', status as 'publicado');
  if (filter === 'aprovacao') query = query.eq('moderation_status', 'pendente');
  if (term.trim()) query = query.ilike('title', `%${term.trim()}%`);
  if (authorId) query = query.eq('author_id', authorId);
  if (categoryId) query = query.eq('category_id', categoryId);
  if (/^\d{4}-\d{2}$/.test(month)) {
    const year = Number(month.slice(0, 4));
    const monthNumber = Number(month.slice(5, 7));
    const start = new Date(Date.UTC(year, monthNumber - 1, 1)).toISOString();
    const end = new Date(Date.UTC(year, monthNumber, 1)).toISOString();
    query = query.gte('updated_at', start).lt('updated_at', end);
  }

  const safePage = Math.max(1, page);
  const from = (safePage - 1) * pageSize;
  const { data, count } = await query.range(from, from + pageSize - 1);
  return { posts: (data ?? []) as unknown as AdminPostRow[], count: count ?? 0, page: safePage, pageSize };
}

export async function countAdminPosts(): Promise<Record<string, number>> {
  const supabase = await createClient();
  const count = async (column?: 'status' | 'moderation_status', value?: string) => {
    let query = supabase.from('posts').select('id', { count: 'exact', head: true });
    if (column === 'status' && value) query = query.eq('status', value as PostStatus);
    if (column === 'moderation_status' && value) query = query.eq('moderation_status', value as ModerationStatus);
    const { count: total } = await query;
    return total ?? 0;
  };
  const [todos, pendentes, aprovacao, publicados, rascunhos, arquivados, removidos] = await Promise.all([
    count(),
    count('status', 'enviado_para_revisao'),
    count('moderation_status', 'pendente'),
    count('status', 'publicado'),
    count('status', 'rascunho'),
    count('status', 'arquivado'),
    count('status', 'removido'),
  ]);
  return { todos, pendentes, aprovacao, publicados, rascunhos, arquivados, removidos };
}

export interface PostAuthorOption {
  id: string;
  full_name: string | null;
}

export async function listPostAuthors(): Promise<PostAuthorOption[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('status', 'active')
    .in('role', ['publisher', 'admin'])
    .order('full_name');
  return data ?? [];
}

export interface PostCategoryOption { id: string; name: string }

export async function listPostCategories(): Promise<PostCategoryOption[]> {
  const supabase = await createClient();
  const { data } = await supabase.from('categories').select('id, name').order('name');
  return data ?? [];
}

export interface AdminEventSubmissionRow {
  id: string;
  title: string;
  description: string;
  event_start_date: string;
  event_end_date: string | null;
  event_location: string;
  event_address: string | null;
  event_ticket_url: string | null;
  event_ticket_price: string | null;
  event_organizer: string;
  event_is_free: boolean;
  submitter_name: string | null;
  submitter_email: string | null;
  submitter_whatsapp: string | null;
  status: string;
  created_at: string;
}

export async function listAdminEventSubmissions(filter = 'pendentes'): Promise<AdminEventSubmissionRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from('event_submissions')
    .select('id, title, description, event_start_date, event_end_date, event_location, event_address, event_ticket_url, event_ticket_price, event_organizer, event_is_free, submitter_name, submitter_email, submitter_whatsapp, status, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  const statuses: Record<string, 'pendente' | 'aprovado' | 'rejeitado'> = {
    pendentes: 'pendente', aprovado: 'aprovado', rejeitado: 'rejeitado',
  };
  if (statuses[filter]) query = query.eq('status', statuses[filter]);
  const { data } = await query;
  return (data ?? []) as AdminEventSubmissionRow[];
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
