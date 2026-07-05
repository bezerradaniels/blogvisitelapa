// Tipos de domínio da camada social (perfis, amizades, mural, depoimentos).
import type { Tables } from './database';
import type { CommunityProfile } from './communities';

export type ProfileDetails = Tables<'profile_details'>;
export type Friendship = Tables<'friendships'>;
export type Scrap = Tables<'scraps'>;
export type Testimonial = Tables<'testimonials'>;

// Perfil resumido reaproveitado dos joins (id, full_name, slug, avatar_url).
export type { CommunityProfile as SocialProfile };

export type ScrapWithAuthor = Scrap & { author: CommunityProfile | null };
export type TestimonialWithAuthor = Testimonial & { author: CommunityProfile | null };

// Estado da relação entre o viewer e o perfil visitado.
export type FriendState = 'self' | 'none' | 'friends' | 'request_sent' | 'request_received';

// Perfil público completo montado para a página /u/[slug].
export interface PublicProfile {
  id: string;
  full_name: string | null;
  slug: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: string;
  details: ProfileDetails | null;
  friendCount: number;
  canView: boolean; // viewer pode ver o conteúdo completo
}
