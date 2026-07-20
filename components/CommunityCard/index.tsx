import Image from 'next/image';
import Link from 'next/link';
import type { CommunityWithOwner } from '@/types/communities';

// Cartão de comunidade para grids e listagens.
export default function CommunityCard({ community }: { community: CommunityWithOwner }) {
  return (
    <Link
      href={`/comunidades/${community.slug}`}
      className="card-hover card-base flex w-full max-w-[320px] gap-3 p-3"
    >
      <span className="relative flex h-[78px] w-[78px] shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-brand-soft font-headline text-xl font-extrabold text-brand-dark">
        {community.avatar_url ? (
          <Image src={community.avatar_url} alt="" fill sizes="78px" className="object-cover" />
        ) : (
          community.name.charAt(0).toUpperCase()
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <h3 className="line-clamp-2 max-w-[200px] text-lg font-bold leading-tight text-title">
            {community.name}
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <span>
            {community.member_count} {community.member_count === 1 ? 'membro' : 'membros'}
          </span>
        </div>
      </div>
    </Link>
  );
}
