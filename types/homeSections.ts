import type { Json } from './database';
import type { PostWithRelations } from './posts';

export type HomeSectionStatus = 'active' | 'inactive';
export type HomeSectionSelectionMode = 'manual' | 'automatic';
export type HomeSectionViewAllMode = 'internal' | 'custom' | 'hidden';
export type HomeSectionPlacementZone = 'after-hero' | 'after-latest-news' | 'before-events' | 'before-footer';

export interface HomeSection {
  id: string; title: string; subtitle: string | null; description: string | null; slug: string;
  status: HomeSectionStatus; display_order: number; placement_zone: HomeSectionPlacementZone;
  selection_mode: HomeSectionSelectionMode; show_view_all: boolean; view_all_mode: HomeSectionViewAllMode;
  custom_view_all_url: string | null; cover_image_url: string | null; cover_image_alt: string | null;
  automatic_rules: Json | null; created_by: string | null; updated_by: string | null;
  created_at: string; updated_at: string; deleted_at: string | null;
}

export interface HomeSectionWithPosts extends HomeSection { posts: PostWithRelations[] }
