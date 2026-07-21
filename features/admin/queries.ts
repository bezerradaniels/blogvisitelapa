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
  published_at: string | null;
  author_id: string;
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
      'id, title, slug, status, moderation_status, is_featured, content_type, updated_at, published_at, author_id, author:profiles!posts_author_id_fkey(full_name), category:categories(name)',
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
