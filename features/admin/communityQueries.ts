import 'server-only';

// Consultas admin de Comunidades e Denúncias (RLS: admin vê tudo).
import { createClient } from '@/lib/supabase/server';
import { adminGuard } from '@/lib/auth/adminGuard';
import type { CommunityWithOwner } from '@/types/communities';
import type { CommunityReport } from '@/types/communities';

const COMMUNITY_STATUS_FILTER: Record<string, string | undefined> = {
  ativas: 'ativa',
  suspensas: 'suspensa',
  removidas: 'removida',
};

export async function listAdminCommunities(filter = 'todas'): Promise<CommunityWithOwner[]> {
  const supabase = await createClient();
  let query = supabase
    .from('communities')
    .select('*, owner:profiles!communities_owner_id_fkey(id, full_name, slug, avatar_url)')
    .order('created_at', { ascending: false })
    .limit(200);

  const status = COMMUNITY_STATUS_FILTER[filter];
  if (status) query = query.eq('status', status as 'ativa');

  const { data } = await query;
  return (data ?? []) as unknown as CommunityWithOwner[];
}

export interface AdminCommunityDetails {
  community: CommunityWithOwner;
  members: Array<{
    id: string;
    role: 'dono' | 'moderador' | 'membro';
    created_at: string;
    profile: { id: string; full_name: string | null; slug: string | null } | null;
  }>;
  topics: Array<{
    id: string;
    title: string;
    slug: string;
    status: 'visivel' | 'removido';
    is_pinned: boolean;
    is_locked: boolean;
    reply_count: number;
    last_activity_at: string;
    created_at: string;
    author: { id: string; full_name: string | null } | null;
  }>;
  reportCount: number;
  openReportCount: number;
  replyCount: number;
}

export async function getAdminCommunityDetails(id: string): Promise<AdminCommunityDetails | null> {
  const ctx = await adminGuard();
  if (!ctx) return null;
  const { supabase } = ctx;

  const [{ data: community, error: communityError }, { data: members, error: membersError }, { data: topics, error: topicsError }] =
    await Promise.all([
      supabase
        .from('communities')
        .select('*, owner:profiles!communities_owner_id_fkey(id, full_name, slug, avatar_url)')
        .eq('id', id)
        .maybeSingle(),
      supabase
        .from('community_members')
        .select('id, role, created_at, profile:profiles!community_members_user_id_fkey(id, full_name, slug)')
        .eq('community_id', id)
        .order('created_at', { ascending: true })
        .limit(100),
      supabase
        .from('community_topics')
        .select('id, title, slug, status, is_pinned, is_locked, reply_count, last_activity_at, created_at, author:profiles!community_topics_author_id_fkey(id, full_name)')
        .eq('community_id', id)
        .order('last_activity_at', { ascending: false })
        .limit(100),
    ]);

  const queryError = communityError ?? membersError ?? topicsError;
  if (queryError) throw new Error(`Não foi possível carregar a comunidade: ${queryError.message}`);
  if (!community) return null;

  const [{ count: directReports, error: directReportsError }, replyResult] = await Promise.all([
    supabase
      .from('community_reports')
      .select('id', { count: 'exact', head: true })
      .eq('target_type', 'comunidade')
      .eq('target_id', id),
    supabase
      .from('community_replies')
      .select('id, topic:community_topics!inner(community_id)', { count: 'exact', head: true })
      .eq('topic.community_id', id),
  ]);
  if (directReportsError || replyResult.error) {
    throw new Error('Não foi possível carregar as métricas da comunidade.');
  }

  const { count: openReports, error: openReportsError } = await supabase
    .from('community_reports')
    .select('id', { count: 'exact', head: true })
    .eq('target_type', 'comunidade')
    .eq('target_id', id)
    .eq('status', 'aberta');
  if (openReportsError) throw new Error('Não foi possível carregar as denúncias da comunidade.');

  return {
    community: community as unknown as CommunityWithOwner,
    members: (members ?? []) as unknown as AdminCommunityDetails['members'],
    topics: (topics ?? []) as unknown as AdminCommunityDetails['topics'],
    reportCount: directReports ?? 0,
    openReportCount: openReports ?? 0,
    replyCount: replyResult.count ?? 0,
  };
}

export interface AdminReportRow extends CommunityReport {
  reporter: { full_name: string | null } | null;
}

export async function listReports(filter = 'abertas'): Promise<AdminReportRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from('community_reports')
    .select('*, reporter:profiles!community_reports_reporter_id_fkey(full_name)')
    .order('created_at', { ascending: false })
    .limit(200);

  if (filter === 'abertas') query = query.eq('status', 'aberta');

  const { data } = await query;
  return (data ?? []) as unknown as AdminReportRow[];
}
