'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import Button from '@/components/Button';
import { createSocialPost } from '@/features/socialFeed/actions';
import type { MentionOption } from '@/types/socialFeed';

interface SocialPostComposerProps {
  mentions: MentionOption[];
}

export default function SocialPostComposer({ mentions }: SocialPostComposerProps) {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const remaining = 180 - content.length;

  function addMention(handle: string) {
    if (!handle) return;
    setContent((current) => {
      const addition = `${current && !current.endsWith(' ') ? ' ' : ''}@${handle} `;
      return `${current}${addition}`.slice(0, 180);
    });
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createSocialPost(content);
      if (!result.ok) return setError(result.error ?? 'Não foi possível publicar.');
      setContent('');
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="card-base space-y-3 p-4">
      <div>
        <h2 className="font-bold text-title">Compartilhe uma atualização</h2>
        <p className="text-xs text-muted">Use @apelido para marcar amigos e #hashtag para organizar assuntos.</p>
      </div>
      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value.slice(0, 180))}
        rows={3}
        maxLength={180}
        disabled={pending}
        placeholder="O que está acontecendo?"
        className="w-full resize-none rounded-[14px] border border-line bg-card p-3 text-sm outline-none focus:border-brand"
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {mentions.length > 0 && (
            <select
              value=""
              disabled={pending}
              onChange={(event) => addMention(event.target.value)}
              aria-label="Marcar um amigo"
              className="h-8 max-w-48 rounded-full border border-line bg-card px-3 text-xs text-body outline-none focus:border-brand"
            >
              <option value="">@ Marcar amigo</option>
              {mentions.map((mention) => (
                <option key={mention.handle} value={mention.handle}>
                  {mention.label} (@{mention.handle})
                </option>
              ))}
            </select>
          )}
          <span className={`text-xs font-bold ${remaining < 20 ? 'text-warning' : 'text-muted'}`}>
            {remaining}
          </span>
        </div>
        <Button size="sm" disabled={pending || content.trim().length === 0 || remaining < 0}>
          {pending ? 'Publicando...' : 'Publicar'}
        </Button>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </form>
  );
}
