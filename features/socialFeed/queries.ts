import 'server-only';

import { createClient } from '@/lib/supabase/server';
import type { MentionOption, SocialFeedPost } from '@/types/socialFeed';

interface RawProfile {
  id: string;
  full_name: string | null;
  slug: string | null;
  avatar_url: string | null;
  details: { nickname: string | null } | null;
}

interface RawPost {
  id: string;
  author_id: string;
  content: string | null;
  repost_of: string | null;
  like_count: number;
  repost_count: number;
  created_at: string;
  author: RawProfile | null;
}

export interface SocialFeedSidebar {
  friendCount: number;
  friends: Array<{
    id: string;
    fullName: string;
    slug: string | null;
    avatarUrl: string | null;
  }>;
  mentions: MentionOption[];
  communities: Array<{
    id: string;
    name: string;
    slug: string;
    avatarUrl: string | null;
    memberCount: number;
  }>;
}

async function getFriendIds(profileId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('friendships')
    .select('requester_id, addressee_id')
    .eq('status', 'aceito')
    .or(`requester_id.eq.${profileId},addressee_id.eq.${profileId}`);
  if (error) throw new Error(`Não foi possível carregar os amigos: ${error.message}`);
  return (data ?? []).map((friendship) =>
    friendship.requester_id === profileId ? friendship.addressee_id : friendship.requester_id,
  );
}

export async function getSocialFeed(
  profileId: string,
  hashtag?: string,
): Promise<SocialFeedPost[]> {
  const supabase = await createClient();
  const friendIds = await getFriendIds(profileId);
  const authorIds = [profileId, ...friendIds];

  let hashtagPostIds: string[] | null = null;
  if (hashtag) {
    const normalized = hashtag.replace(/^#/, '').toLocaleLowerCase('pt-BR').slice(0, 50);
    const { data, error } = await supabase
      .from('social_post_hashtags')
      .select('post_id')
      .eq('tag', normalized)
      .limit(200);
    if (error) throw new Error(`Não foi possível filtrar a hashtag: ${error.message}`);
    hashtagPostIds = (data ?? []).map((row) => row.post_id);
    if (hashtagPostIds.length === 0) return [];
  }

  let query = supabase
    .from('social_posts')
    .select(`
      id, author_id, content, repost_of, like_count, repost_count, created_at,
      author:profiles!social_posts_author_id_fkey(
        id, full_name, slug, avatar_url,
        details:profile_details(nickname)
      )
    `)
    .in('author_id', authorIds)
    .order('created_at', { ascending: false })
    .limit(30);
  if (hashtagPostIds) {
    const ids = hashtagPostIds.join(',');
    query = query.or(`id.in.(${ids}),repost_of.in.(${ids})`);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Não foi possível carregar o feed: ${error.message}`);
  const rows = (data ?? []) as unknown as RawPost[];
  const originalIds = [...new Set(rows.flatMap((row) => row.repost_of ? [row.repost_of] : []))];
  const { data: originalsData, error: originalsError } = originalIds.length > 0
    ? await supabase
        .from('social_posts')
        .select(`
          id, author_id, content, repost_of, like_count, repost_count, created_at,
          author:profiles!social_posts_author_id_fkey(
            id, full_name, slug, avatar_url,
            details:profile_details(nickname)
          )
        `)
        .in('id', originalIds)
    : { data: [], error: null };
  if (originalsError) throw new Error(`Não foi possível carregar os reposts: ${originalsError.message}`);
  const originalById = new Map(
    ((originalsData ?? []) as unknown as RawPost[]).map((original) => [original.id, original]),
  );
  const targetIds = rows.map((row) => row.repost_of ?? row.id);

  const [{ data: likes, error: likesError }, { data: reposts, error: repostsError }] =
    targetIds.length > 0
      ? await Promise.all([
          supabase
            .from('social_post_likes')
            .select('post_id')
            .eq('profile_id', profileId)
            .in('post_id', targetIds),
          supabase
            .from('social_posts')
            .select('repost_of')
            .eq('author_id', profileId)
            .in('repost_of', targetIds),
        ])
      : [{ data: [], error: null }, { data: [], error: null }];
  if (likesError || repostsError) throw new Error('Não foi possível carregar as interações do feed.');

  const likedIds = new Set((likes ?? []).map((like) => like.post_id));
  const repostedIds = new Set((reposts ?? []).map((repost) => repost.repost_of));

  return rows.flatMap((row) => {
    const target = row.repost_of ? originalById.get(row.repost_of) : row;
    if (!target) return [];
    if (!target.author || !target.content || !row.author) return [];
    const nickname = target.author.details?.nickname ?? null;
    return [{
      id: target.id,
      content: target.content,
      createdAt: row.created_at,
      likeCount: target.like_count,
      repostCount: target.repost_count,
      author: {
        id: target.author.id,
        full_name: target.author.full_name,
        slug: target.author.slug,
        avatar_url: target.author.avatar_url,
        nickname,
      },
      repostedBy: row.repost_of
        ? {
            id: row.author.id,
            full_name: row.author.full_name,
            slug: row.author.slug,
            avatar_url: row.author.avatar_url,
            nickname: row.author.details?.nickname ?? null,
          }
        : null,
      likedByMe: likedIds.has(target.id),
      repostedByMe: repostedIds.has(target.id),
      canDelete: target.author_id === profileId,
    } satisfies SocialFeedPost];
  });
}

export async function getProfileSocialPosts(
  profileId: string,
  viewerProfileId: string | null,
  limit = 3,
): Promise<SocialFeedPost[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('social_posts')
    .select(`
      id, author_id, content, repost_of, like_count, repost_count, created_at,
      author:profiles!social_posts_author_id_fkey(
        id, full_name, slug, avatar_url,
        details:profile_details(nickname)
      )
    `)
    .eq('author_id', profileId)
    .is('repost_of', null)
    .order('created_at', { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 50));
  // Mantém o restante do perfil público disponível durante o intervalo entre o
  // deploy da aplicação e a aplicação da migration 0021. Outros erros continuam
  // explícitos para não esconder falhas reais de consulta.
  if (error?.code === '42501') return [];
  if (error) throw new Error(`Não foi possível carregar as atualizações: ${error.message}`);

  const rows = (data ?? []) as unknown as RawPost[];
  const ids = rows.map((row) => row.id);
  const [{ data: likes }, { data: reposts }] = viewerProfileId && ids.length > 0
    ? await Promise.all([
        supabase
          .from('social_post_likes')
          .select('post_id')
          .eq('profile_id', viewerProfileId)
          .in('post_id', ids),
        supabase
          .from('social_posts')
          .select('repost_of')
          .eq('author_id', viewerProfileId)
          .in('repost_of', ids),
      ])
    : [{ data: [] }, { data: [] }];
  const likedIds = new Set((likes ?? []).map((like) => like.post_id));
  const repostedIds = new Set((reposts ?? []).map((repost) => repost.repost_of));

  return rows.flatMap((row) => {
    if (!row.author || !row.content) return [];
    return [{
      id: row.id,
      content: row.content,
      createdAt: row.created_at,
      likeCount: row.like_count,
      repostCount: row.repost_count,
      author: {
        id: row.author.id,
        full_name: row.author.full_name,
        slug: row.author.slug,
        avatar_url: row.author.avatar_url,
        nickname: row.author.details?.nickname ?? null,
      },
      repostedBy: null,
      likedByMe: likedIds.has(row.id),
      repostedByMe: repostedIds.has(row.id),
      canDelete: viewerProfileId === row.author_id,
    } satisfies SocialFeedPost];
  });
}

export async function getSocialFeedSidebar(profileId: string): Promise<SocialFeedSidebar> {
  const supabase = await createClient();
  const friendIds = await getFriendIds(profileId);
  const [{ data: friends, error: friendsError }, { data: memberships, error: membershipsError }] =
    await Promise.all([
      friendIds.length > 0
        ? supabase
            .from('profiles')
            .select('id, full_name, slug, avatar_url, details:profile_details(nickname)')
            .in('id', friendIds)
            .eq('status', 'active')
            .limit(12)
        : Promise.resolve({ data: [], error: null }),
      supabase
        .from('community_members')
        .select('community:communities!community_members_community_id_fkey(id, name, slug, avatar_url, member_count)')
        .eq('user_id', profileId)
        .limit(9),
    ]);
  if (friendsError || membershipsError) throw new Error('Não foi possível carregar os atalhos sociais.');

  const friendRows = (friends ?? []) as unknown as Array<RawProfile>;
  const communities = (memberships ?? []) as unknown as Array<{
    community: { id: string; name: string; slug: string; avatar_url: string | null; member_count: number } | null;
  }>;
  return {
    friendCount: friendIds.length,
    friends: friendRows.map((friend) => ({
      id: friend.id,
      fullName: friend.full_name ?? friend.details?.nickname ?? 'Usuário',
      slug: friend.slug,
      avatarUrl: friend.avatar_url,
    })),
    mentions: friendRows
      .filter((friend) => friend.slug)
      .map((friend) => ({
        handle: friend.slug!,
        label: friend.details?.nickname ?? friend.full_name ?? friend.slug!,
      })),
    communities: communities.flatMap(({ community }) =>
      community
        ? [{
            id: community.id,
            name: community.name,
            slug: community.slug,
            avatarUrl: community.avatar_url,
            memberCount: community.member_count,
          }]
        : [],
    ),
  };
}
