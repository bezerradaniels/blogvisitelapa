'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import Icon from '@/components/Icon';
import {
  createSocialPostComment,
  deleteSocialPostComment,
  fetchSocialPostComments,
} from '@/features/socialFeed/actions';
import { LinkedContent } from '@/features/socialFeed/LinkedContent';
import { timeAgo, titleCase } from '@/lib/utils/format';
import type { SocialFeedPost, SocialPostComment } from '@/types/socialFeed';

interface SocialPostModalProps {
  post: SocialFeedPost;
  postOwnedByMe: boolean;
  liked: boolean;
  likeCount: number;
  onToggleLike: () => void;
  onClose: () => void;
  onCommentCountChange: (delta: number) => void;
}

const MAX = 500;

function Avatar({ url, name, size }: { url: string | null; name: string; size: number }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-brand-soft font-bold text-brand-dark"
      style={{ width: size, height: size }}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

export default function SocialPostModal({
  post,
  postOwnedByMe,
  liked,
  likeCount,
  onToggleLike,
  onClose,
  onCommentCountChange,
}: SocialPostModalProps) {
  const router = useRouter();
  const [comments, setComments] = useState<SocialPostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const authorName = post.author.nickname ?? (titleCase(post.author.full_name) || 'Usuário');

  // Carrega respostas ao abrir; trava scroll do body e fecha no Esc.
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    let active = true;
    fetchSocialPostComments(post.id).then((result) => {
      if (!active) return;
      if (result.ok && result.comments) setComments(result.comments);
      else setLoadError(result.error ?? 'Não foi possível carregar as respostas.');
      setLoading(false);
    });
    return () => {
      active = false;
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [post.id, onClose]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    startTransition(async () => {
      const result = await createSocialPostComment(post.id, content);
      if (!result.ok || !result.comment) {
        alert(result.error ?? 'Não foi possível responder.');
        return;
      }
      setComments((current) => [...current, result.comment!]);
      setText('');
      onCommentCountChange(1);
      inputRef.current?.focus();
    });
  }

  function removeComment(commentId: string) {
    if (!confirm('Excluir esta resposta?')) return;
    startTransition(async () => {
      const result = await deleteSocialPostComment(commentId);
      if (!result.ok) {
        alert(result.error ?? 'Não foi possível excluir a resposta.');
        return;
      }
      setComments((current) => current.filter((comment) => comment.id !== commentId));
      onCommentCountChange(-1);
      router.refresh();
    });
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Respostas da publicação"
    >
      <button type="button" aria-label="Fechar" className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative flex max-h-[90vh] w-full max-w-xl flex-col rounded-t-2xl border border-line bg-card shadow-xl sm:rounded-2xl">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="text-sm font-extrabold text-title">Publicação</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-8 w-8 items-center justify-center rounded-full text-title hover:bg-surface"
          >
            <Icon icon="Cancel01Icon" size={18} />
          </button>
        </div>

        {/* Conteúdo rolável: post + respostas */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <div className="flex gap-3">
            <Link href={post.author.slug ? `/u/${post.author.slug}` : '#'} onClick={onClose}>
              <Avatar url={post.author.avatar_url} name={authorName} size={44} />
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <Link
                  href={post.author.slug ? `/u/${post.author.slug}` : '#'}
                  onClick={onClose}
                  className="font-bold text-title hover:text-brand hover:underline"
                >
                  {authorName}
                </Link>
                {post.author.slug && <span className="text-xs text-muted">@{post.author.slug}</span>}
                <time className="text-xs text-muted" dateTime={post.createdAt}>· {timeAgo(post.createdAt)}</time>
              </div>
              <p className="mt-1 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-body">
                <LinkedContent content={post.content} />
              </p>
              <div className="mt-2 flex items-center gap-5 text-xs font-semibold">
                <button type="button" onClick={onToggleLike} className={`inline-flex items-center gap-1.5 ${liked ? 'text-danger' : 'text-muted hover:text-danger'}`}>
                  <Icon icon="FavouriteIcon" size={16} /> {likeCount || 'Curtir'}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-line pt-4">
            {loading ? (
              <p className="text-sm text-muted">Carregando respostas…</p>
            ) : loadError ? (
              <p className="text-sm text-danger">{loadError}</p>
            ) : comments.length === 0 ? (
              <p className="text-sm text-muted">Nenhuma resposta ainda. Seja o primeiro a responder.</p>
            ) : (
              <ul className="space-y-4">
                {comments.map((comment) => {
                  const name = comment.author.nickname ?? (titleCase(comment.author.full_name) || 'Usuário');
                  return (
                    <li key={comment.id} className="flex gap-3">
                      <Link href={comment.author.slug ? `/u/${comment.author.slug}` : '#'} onClick={onClose}>
                        <Avatar url={comment.author.avatar_url} name={name} size={36} />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <Link
                            href={comment.author.slug ? `/u/${comment.author.slug}` : '#'}
                            onClick={onClose}
                            className="text-sm font-bold text-title hover:text-brand hover:underline"
                          >
                            {name}
                          </Link>
                          <time className="text-xs text-muted" dateTime={comment.createdAt}>· {timeAgo(comment.createdAt)}</time>
                          {(comment.canDelete || postOwnedByMe) && (
                            <button
                              type="button"
                              disabled={pending}
                              onClick={() => removeComment(comment.id)}
                              className="ml-auto text-xs font-semibold text-muted hover:text-danger"
                            >
                              Excluir
                            </button>
                          )}
                        </div>
                        <p className="mt-0.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-body">
                          <LinkedContent content={comment.content} />
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Campo de resposta */}
        <form onSubmit={submit} className="border-t border-line px-4 py-3">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX))}
            placeholder="Escreva uma resposta…"
            rows={2}
            aria-label="Escreva uma resposta"
            className="w-full resize-none rounded-lg border border-line bg-surface px-3 py-2 text-sm text-body outline-none focus:border-brand"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-muted">{text.trim().length}/{MAX}</span>
            <button
              type="submit"
              disabled={pending || text.trim().length === 0}
              className="rounded-full bg-brand px-4 py-1.5 text-sm font-bold text-white disabled:opacity-50"
            >
              {pending ? 'Enviando…' : 'Responder'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
