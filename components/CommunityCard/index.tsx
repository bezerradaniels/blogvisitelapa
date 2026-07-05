import Image from 'next/image';
import Link from 'next/link';
import Badge from '@/components/Badge';
import { communityCategoryLabel } from '@/lib/config/communities';
import type { CommunityWithOwner } from '@/types/communities';

// Cartão de comunidade para grids e listagens.
export default function CommunityCard({ community }: { community: CommunityWithOwner }) {
  return (
    <Link
      href={`/comunidades/${community.slug}`}
      className="card-hover card-base flex gap-3 p-3"
    >
      <span className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-brand-soft font-headline text-xl font-extrabold text-brand-dark">
        {community.avatar_url ? (
          <Image src={community.avatar_url} alt="" fill sizes="56px" className="object-cover" />
        ) : (
          community.name.charAt(0).toUpperCase()
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <h3 className="truncate font-bold text-title">{community.name}</h3>
        </div>
        {community.description && (
          <p className="mb-2 line-clamp-2 text-sm text-muted">{community.description}</p>
        )}
        <div className="flex items-center gap-2 text-xs text-muted">
          <Badge tone="success">{communityCategoryLabel(community.category)}</Badge>
          <span>
            {community.member_count} {community.member_count === 1 ? 'membro' : 'membros'}
          </span>
        </div>
      </div>
    </Link>
  );
}
