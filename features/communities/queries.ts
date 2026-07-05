import 'server-only';

// Consultas da área de Comunidades. RLS garante visibilidade (comunidades
// ativas, conteúdo visível). Sempre no servidor.
import { createClient } from '@/lib/supabase/server';
import type {
  CommunityWithOwner,
  MemberWithProfile,
  ReplyWithAuthor,
  TopicWithAuthor,
  CommunityMember,
} from '@/types/communities';

const OWNER_SELECT =
  'owner:profiles!communities_owner_id_fkey(id, full_name, slug, avatar_url)';
const AUTHOR_SELECT = (fk: string) =>
  `author:profiles!${fk}(id, full_name, slug, avatar_url)`;

export async function listCommunities(opts: { category?: string; q?: string } = {}): Promise<
  CommunityWithOwner[]
> {
  const supabase = await createClient();
  let query = supabase
    .from('communities')
    .select(`*, ${OWNER_SELECT}`)
    .eq('status', 'ativa')
    .order('member_count', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(60);

  if (opts.category) query = query.eq('category', opts.category as 'outros');
  if (opts.q?.trim()) query = query.ilike('name', `%${opts.q.trim()}%`);

  const { data } = await query;
  return (data ?? []) as unknown as CommunityWithOwner[];
}

export async function getCommunityBySlug(slug: string): Promise<CommunityWithOwner | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('communities')
    .select(`*, ${OWNER_SELECT}`)
    .eq('slug', slug)
    .maybeSingle();
  return (data as unknown as CommunityWithOwner) ?? null;
}

// Papel do usuário atual na comunidade (null se não é membro).
export async function getMembership(
  communityId: string,
  profileId: string | null,
): Promise<CommunityMember | null> {
  if (!profileId) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from('community_members')
    .select('*')
    .eq('community_id', communityId)
    .eq('user_id', profileId)
    .maybeSingle();
  return (data as CommunityMember) ?? null;
}

export async function listTopics(communityId: string): Promise<TopicWithAuthor[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('community_topics')
    .select(`*, ${AUTHOR_SELECT('community_topics_author_id_fkey')}`)
    .eq('community_id', communityId)
    .eq('status', 'visivel')
    .order('is_pinned', { ascending: false })
    .order('last_activity_at', { ascending: false })
    .limit(100);
  return (data ?? []) as unknown as TopicWithAuthor[];
}

export async function getTopic(
  communityId: string,
  topicSlug: string,
): Promise<TopicWithAuthor | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('community_topics')
    .select(`*, ${AUTHOR_SELECT('community_topics_author_id_fkey')}`)
    .eq('community_id', communityId)
    .eq('slug', topicSlug)
    .maybeSingle();
  return (data as unknown as TopicWithAuthor) ?? null;
}

export async function listReplies(topicId: string): Promise<ReplyWithAuthor[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('community_replies')
    .select(`*, ${AUTHOR_SELECT('community_replies_author_id_fkey')}`)
    .eq('topic_id', topicId)
    .eq('status', 'visivel')
    .order('created_at', { ascending: true })
    .limit(500);
  return (data ?? []) as unknown as ReplyWithAuthor[];
}

export async function listMembers(communityId: string): Promise<MemberWithProfile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('community_members')
    .select('*, profile:profiles!community_members_user_id_fkey(id, full_name, slug, avatar_url)')
    .eq('community_id', communityId)
    .order('role', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(500);
  return (data ?? []) as unknown as MemberWithProfile[];
}

// Comunidades das quais o usuário participa.
export async function listUserCommunities(profileId: string): Promise<CommunityWithOwner[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('community_members')
    .select(`community:communities!community_members_community_id_fkey(*, ${OWNER_SELECT})`)
    .eq('user_id', profileId)
    .order('created_at', { ascending: false });

  return ((data ?? []) as unknown as { community: CommunityWithOwner | null }[])
    .map((row) => row.community)
    .filter((c): c is CommunityWithOwner => c !== null && c.status === 'ativa');
}
