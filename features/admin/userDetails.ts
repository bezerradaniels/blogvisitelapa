import 'server-only';

import { adminGuard } from '@/lib/auth/adminGuard';
import { createAdminClient } from '@/lib/supabase/admin';
import type { AccountStatus, ProfileVisibility, UserRole } from '@/types/database';

export interface AdminUserDetails {
  profile: {
    id: string;
    userId: string;
    fullName: string | null;
    slug: string | null;
    avatarUrl: string | null;
    phone: string | null;
    bio: string | null;
    role: UserRole;
    status: AccountStatus;
    createdAt: string;
    updatedAt: string;
  };
  auth: {
    email: string | null;
    phone: string | null;
    createdAt: string;
    confirmedAt: string | null;
    lastSignInAt: string | null;
    bannedUntil: string | null;
    providers: string[];
  };
  social: {
    nickname: string | null;
    city: string | null;
    birthDate: string | null;
    visibility: ProfileVisibility | null;
  };
  attention: {
    note: string | null;
    flaggedAt: string;
  } | null;
  usage: {
    posts: number;
    postViews: number;
    comments: number;
    ratings: number;
    favorites: number;
    friends: number;
    messages: number;
    photos: number;
    communities: number;
    lastActivityAt: string | null;
  };
}

export async function getAdminUserDetails(profileId: string): Promise<AdminUserDetails | null> {
  const ctx = await adminGuard();
  if (!ctx) return null;

  const { supabase } = ctx;
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, user_id, full_name, slug, avatar_url, phone, bio, role, status, created_at, updated_at')
    .eq('id', profileId)
    .maybeSingle();

  if (profileError) throw new Error(`Não foi possível carregar o usuário: ${profileError.message}`);
  if (!profile) return null;

  const adminClient = createAdminClient();
  const [
    authResult,
    detailsResult,
    attentionResult,
    postsResult,
    commentsResult,
    ratingsResult,
    favoritesResult,
    friendsResult,
    messagesResult,
    photosResult,
    communitiesResult,
  ] = await Promise.all([
    adminClient.auth.admin.getUserById(profile.user_id),
    supabase
      .from('profile_details')
      .select('nickname, city, birth_date, visibility')
      .eq('profile_id', profileId)
      .maybeSingle(),
    supabase
      .from('audit_logs')
      .select('action, metadata, created_at')
      .eq('entity', 'profiles')
      .eq('entity_id', profileId)
      .in('action', ['user.attention_flagged', 'user.attention_cleared'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('posts')
      .select('views_count, created_at', { count: 'exact' })
      .eq('author_id', profileId),
    supabase
      .from('comments')
      .select('created_at', { count: 'exact' })
      .eq('user_id', profileId)
      .order('created_at', { ascending: false })
      .limit(1),
    supabase
      .from('ratings')
      .select('created_at', { count: 'exact' })
      .eq('user_id', profileId)
      .order('created_at', { ascending: false })
      .limit(1),
    supabase
      .from('favorites')
      .select('created_at', { count: 'exact' })
      .eq('user_id', profileId)
      .order('created_at', { ascending: false })
      .limit(1),
    supabase
      .from('friendships')
      .select('updated_at', { count: 'exact' })
      .or(`requester_id.eq.${profileId},addressee_id.eq.${profileId}`)
      .eq('status', 'aceito')
      .order('updated_at', { ascending: false })
      .limit(1),
    supabase
      .from('messages')
      .select('created_at', { count: 'exact' })
      .eq('sender_id', profileId)
      .order('created_at', { ascending: false })
      .limit(1),
    supabase
      .from('photos')
      .select('created_at', { count: 'exact' })
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(1),
    supabase
      .from('community_members')
      .select('created_at', { count: 'exact' })
      .eq('user_id', profileId)
      .order('created_at', { ascending: false })
      .limit(1),
  ]);

  if (authResult.error) throw new Error(`Não foi possível carregar a conta: ${authResult.error.message}`);
  const queryError = [
    detailsResult,
    attentionResult,
    postsResult,
    commentsResult,
    ratingsResult,
    favoritesResult,
    friendsResult,
    messagesResult,
    photosResult,
    communitiesResult,
  ].find((result) => result.error)?.error;
  if (queryError) throw new Error(`Não foi possível carregar o uso do aplicativo: ${queryError.message}`);

  const authUser = authResult.data.user;
  const providers = authUser.app_metadata.providers;
  const activityDates = [
    ...(postsResult.data ?? []).map((post) => post.created_at),
    commentsResult.data?.[0]?.created_at,
    ratingsResult.data?.[0]?.created_at,
    favoritesResult.data?.[0]?.created_at,
    friendsResult.data?.[0]?.updated_at,
    messagesResult.data?.[0]?.created_at,
    photosResult.data?.[0]?.created_at,
    communitiesResult.data?.[0]?.created_at,
  ].filter((value): value is string => Boolean(value));

  return {
    profile: {
      id: profile.id,
      userId: profile.user_id,
      fullName: profile.full_name,
      slug: profile.slug,
      avatarUrl: profile.avatar_url,
      phone: profile.phone,
      bio: profile.bio,
      role: profile.role,
      status: profile.status,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    },
    auth: {
      email: authUser.email ?? null,
      phone: authUser.phone ?? null,
      createdAt: authUser.created_at,
      confirmedAt: authUser.confirmed_at ?? null,
      lastSignInAt: authUser.last_sign_in_at ?? null,
      bannedUntil: authUser.banned_until ?? null,
      providers: Array.isArray(providers) ? providers.filter((value): value is string => typeof value === 'string') : [],
    },
    social: {
      nickname: detailsResult.data?.nickname ?? null,
      city: detailsResult.data?.city ?? null,
      birthDate: detailsResult.data?.birth_date ?? null,
      visibility: detailsResult.data?.visibility ?? null,
    },
    attention: attentionResult.data?.action === 'user.attention_flagged'
      ? {
          note:
            attentionResult.data.metadata &&
            typeof attentionResult.data.metadata === 'object' &&
            !Array.isArray(attentionResult.data.metadata) &&
            typeof attentionResult.data.metadata.note === 'string'
              ? attentionResult.data.metadata.note
              : null,
          flaggedAt: attentionResult.data.created_at,
        }
      : null,
    usage: {
      posts: postsResult.count ?? 0,
      postViews: (postsResult.data ?? []).reduce((total, post) => total + post.views_count, 0),
      comments: commentsResult.count ?? 0,
      ratings: ratingsResult.count ?? 0,
      favorites: favoritesResult.count ?? 0,
      friends: friendsResult.count ?? 0,
      messages: messagesResult.count ?? 0,
      photos: photosResult.count ?? 0,
      communities: communitiesResult.count ?? 0,
      lastActivityAt: activityDates.sort().at(-1) ?? null,
    },
  };
}
