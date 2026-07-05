import 'server-only';

// Consultas da camada social. A visibilidade real é garantida pela RLS
// (profile_details/scraps/testimonials via can_view_profile). Sempre no servidor.
import { createClient } from '@/lib/supabase/server';
import type { CommunityProfile } from '@/types/communities';
import type {
  FriendState,
  ProfileDetails,
  PublicProfile,
  ScrapWithAuthor,
  TestimonialWithAuthor,
} from '@/types/social';

const PROFILE_COLS = 'id, full_name, slug, avatar_url';

// Monta o perfil público para /u/[slug]. A visibilidade é avaliada pela RLS/RPC
// com base na sessão autenticada atual (não precisa do id do viewer aqui).
export async function getPublicProfile(slug: string): Promise<PublicProfile | null> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, slug, avatar_url, bio, role')
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle();
  if (!profile) return null;

  // can_view_profile respeita público/amigos/oculto (SECURITY DEFINER).
  const { data: canView } = await supabase.rpc('can_view_profile', { target: profile.id });

  let details: ProfileDetails | null = null;
  if (canView) {
    const { data } = await supabase
      .from('profile_details')
      .select('*')
      .eq('profile_id', profile.id)
      .maybeSingle();
    details = (data as ProfileDetails) ?? null;
  }

  const { count } = await supabase
    .from('friendships')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'aceito')
    .or(`requester_id.eq.${profile.id},addressee_id.eq.${profile.id}`);

  return {
    id: profile.id,
    full_name: profile.full_name,
    slug: profile.slug,
    avatar_url: profile.avatar_url,
    bio: profile.bio,
    role: profile.role,
    details,
    friendCount: count ?? 0,
    canView: Boolean(canView),
  } satisfies PublicProfile;
}

// Estado da relação entre viewer e alvo.
export async function getFriendState(
  targetProfileId: string,
  viewerProfileId: string | null,
): Promise<FriendState> {
  if (!viewerProfileId) return 'none';
  if (viewerProfileId === targetProfileId) return 'self';

  const supabase = await createClient();
  const { data } = await supabase
    .from('friendships')
    .select('requester_id, addressee_id, status')
    .or(
      `and(requester_id.eq.${viewerProfileId},addressee_id.eq.${targetProfileId}),and(requester_id.eq.${targetProfileId},addressee_id.eq.${viewerProfileId})`,
    )
    .maybeSingle();

  if (!data) return 'none';
  if (data.status === 'aceito') return 'friends';
  return data.requester_id === viewerProfileId ? 'request_sent' : 'request_received';
}

export async function listFriends(profileId: string): Promise<CommunityProfile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('friendships')
    .select(
      `requester_id, addressee_id,
       requester:profiles!friendships_requester_id_fkey(${PROFILE_COLS}),
       addressee:profiles!friendships_addressee_id_fkey(${PROFILE_COLS})`,
    )
    .eq('status', 'aceito')
    .or(`requester_id.eq.${profileId},addressee_id.eq.${profileId}`)
    .limit(500);

  return ((data ?? []) as unknown as {
    requester_id: string;
    requester: CommunityProfile | null;
    addressee: CommunityProfile | null;
  }[])
    .map((row) => (row.requester_id === profileId ? row.addressee : row.requester))
    .filter((p): p is CommunityProfile => Boolean(p));
}

export async function listScraps(profileId: string): Promise<ScrapWithAuthor[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('scraps')
    .select(`*, author:profiles!scraps_author_id_fkey(${PROFILE_COLS})`)
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(200);
  return (data ?? []) as unknown as ScrapWithAuthor[];
}

// Depoimentos aprovados (para a página pública).
export async function listApprovedTestimonials(profileId: string): Promise<TestimonialWithAuthor[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('testimonials')
    .select(`*, author:profiles!testimonials_author_id_fkey(${PROFILE_COLS})`)
    .eq('profile_id', profileId)
    .eq('status', 'aprovado')
    .order('created_at', { ascending: false })
    .limit(200);
  return (data ?? []) as unknown as TestimonialWithAuthor[];
}

// Depoimentos pendentes recebidos (para gestão em /perfil — RLS: só o dono vê).
export async function listPendingTestimonials(profileId: string): Promise<TestimonialWithAuthor[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('testimonials')
    .select(`*, author:profiles!testimonials_author_id_fkey(${PROFILE_COLS})`)
    .eq('profile_id', profileId)
    .eq('status', 'pendente')
    .order('created_at', { ascending: false })
    .limit(100);
  return (data ?? []) as unknown as TestimonialWithAuthor[];
}

// Pedidos de amizade recebidos (pendentes).
export async function listFriendRequests(profileId: string): Promise<CommunityProfile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('friendships')
    .select(`requester:profiles!friendships_requester_id_fkey(${PROFILE_COLS})`)
    .eq('addressee_id', profileId)
    .eq('status', 'pendente')
    .order('created_at', { ascending: false })
    .limit(100);
  return ((data ?? []) as unknown as { requester: CommunityProfile | null }[])
    .map((row) => row.requester)
    .filter((p): p is CommunityProfile => Boolean(p));
}
