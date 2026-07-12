'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Fragment, useState, useTransition } from 'react';
import {
  deleteSocialPost,
  toggleSocialPostLike,
  toggleSocialPostRepost,
} from '@/features/socialFeed/actions';
import { timeAgo } from '@/lib/utils/format';
import type { SocialFeedPost } from '@/types/socialFeed';

function LinkedContent({ content }: { content: string }) {
  const pieces = content.split(/(@[a-z0-9][a-z0-9-]{1,59}|#[\p{L}\p{N}_]{1,50})/giu);
  return pieces.map((piece, index) => {
    if (piece.startsWith('@')) {
      const handle = piece.slice(1);
      return <Link key={`${piece}-${index}`} href={`/u/${handle}`} className="font-semibold text-brand hover:underline">{piece}</Link>;
    }
    if (piece.startsWith('#')) {
      const tag = piece.slice(1);
      return <Link key={`${piece}-${index}`} href={`/rede?hashtag=${encodeURIComponent(tag)}`} className="font-semibold text-brand hover:underline">{piece}</Link>;
    }
    return <Fragment key={index}>{piece}</Fragment>;
  });
}

export default function SocialPostCard({ post }: { post: SocialFeedPost }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [liked, setLiked] = useState(post.likedByMe);
  const [reposted, setReposted] = useState(post.repostedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [repostCount, setRepostCount] = useState(post.repostCount);
  const authorName = post.author.nickname ?? post.author.full_name ?? 'Usuário';

  function toggleLike() {
    startTransition(async () => {
      const result = await toggleSocialPostLike(post.id);
      if (!result.ok) return alert(result.error ?? 'Não foi possível curtir.');
      setLiked((current) => !current);
      setLikeCount((current) => Math.max(0, current + (liked ? -1 : 1)));
    });
  }

  function toggleRepost() {
    startTransition(async () => {
      const result = await toggleSocialPostRepost(post.id);
      if (!result.ok) return alert(result.error ?? 'Não foi possível repostar.');
      setReposted((current) => !current);
      setRepostCount((current) => Math.max(0, current + (reposted ? -1 : 1)));
      router.refresh();
    });
  }

  function remove() {
    if (!confirm('Excluir esta publicação?')) return;
    startTransition(async () => {
      const result = await deleteSocialPost(post.id);
      if (!result.ok) return alert(result.error ?? 'Não foi possível excluir.');
      router.refresh();
    });
  }

  return (
    <article className="card-base p-4">
      {post.repostedBy && (
        <p className="mb-2 text-xs font-semibold text-muted">
          ↻ {post.repostedBy.nickname ?? post.repostedBy.full_name ?? 'Um amigo'} repostou
        </p>
      )}
      <div className="flex gap-3">
        <Link href={post.author.slug ? `/u/${post.author.slug}` : '#'} className="shrink-0">
          {post.author.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.author.avatar_url} alt="" className="h-11 w-11 rounded-full object-cover" />
          ) : (
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft font-bold text-brand-dark">
              {authorName.charAt(0).toUpperCase()}
            </span>
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <Link href={post.author.slug ? `/u/${post.author.slug}` : '#'} className="font-bold text-title hover:text-brand hover:underline">
              {authorName}
            </Link>
            {post.author.slug && <span className="text-xs text-muted">@{post.author.slug}</span>}
            <time className="text-xs text-muted" dateTime={post.createdAt}>· {timeAgo(post.createdAt)}</time>
          </div>
          <p className="mt-2 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-body">
            <LinkedContent content={post.content} />
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-5 text-xs font-semibold">
            <button type="button" disabled={pending} onClick={toggleLike} className={liked ? 'text-danger' : 'text-muted hover:text-danger'}>
              {liked ? '♥' : '♡'} {likeCount || 'Curtir'}
            </button>
            <button type="button" disabled={pending} onClick={toggleRepost} className={reposted ? 'text-brand' : 'text-muted hover:text-brand'}>
              ↻ {repostCount || 'Repostar'}
            </button>
            {post.canDelete && (
              <button type="button" disabled={pending} onClick={remove} className="ml-auto text-muted hover:text-danger">
                Excluir
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
