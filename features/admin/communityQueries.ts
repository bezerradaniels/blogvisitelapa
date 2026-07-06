import 'server-only';

// Consultas admin de Comunidades e Denúncias (RLS: admin vê tudo).
import { createClient } from '@/lib/supabase/server';
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
