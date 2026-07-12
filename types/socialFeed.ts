export interface FeedProfile {
  id: string;
  full_name: string | null;
  slug: string | null;
  avatar_url: string | null;
  nickname: string | null;
}

export interface SocialFeedPost {
  id: string;
  content: string;
  createdAt: string;
  likeCount: number;
  repostCount: number;
  author: FeedProfile;
  repostedBy: FeedProfile | null;
  likedByMe: boolean;
  repostedByMe: boolean;
  canDelete: boolean;
}

export interface MentionOption {
  handle: string;
  label: string;
}
