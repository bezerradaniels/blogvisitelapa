// Tipos de domínio da área de Comunidades.
import type { Tables } from './database';

export type Community = Tables<'communities'>;
export type CommunityMember = Tables<'community_members'>;
export type CommunityTopic = Tables<'community_topics'>;
export type CommunityReply = Tables<'community_replies'>;
export type CommunityReport = Tables<'community_reports'>;

// Perfil resumido usado nos joins (autor/dono/membro).
export interface CommunityProfile {
  id: string;
  full_name: string | null;
  slug: string | null;
  avatar_url: string | null;
}

export type CommunityWithOwner = Community & { owner: CommunityProfile | null };
export type TopicWithAuthor = CommunityTopic & { author: CommunityProfile | null };
export type ReplyWithAuthor = CommunityReply & { author: CommunityProfile | null };
export type MemberWithProfile = CommunityMember & { profile: CommunityProfile | null };
