'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import Button from '@/components/Button';
import { createSocialPost } from '@/features/socialFeed/actions';

export default function SocialPostComposer() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const remaining = 180 - content.length;
  const progress = Math.min(100, (content.length / 180) * 100);
  const progressTone = remaining < 0 ? 'text-danger' : remaining < 20 ? 'text-warning' : 'text-brand';

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
      </div>
      <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap break-words rounded-[14px] border border-transparent p-3 text-sm leading-normal text-transparent"
        >
          {content.slice(0, 180)}
          {content.length > 180 && <mark className="bg-[#fbe0e3] text-transparent">{content.slice(180)}</mark>}
        </div>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={3}
          disabled={pending}
          placeholder="O que está acontecendo?"
          className="relative w-full resize-none rounded-[14px] border border-line bg-transparent p-3 text-sm leading-normal outline-none focus:border-brand"
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" disabled={pending || content.trim().length === 0 || remaining < 0}>
          {pending ? 'Publicando...' : 'Publicar'}
        </Button>
        <span
          aria-label={`${remaining} caracteres restantes de 180`}
          className="relative flex h-9 w-9 items-center justify-center text-[10px] font-extrabold text-muted"
        >
          <svg viewBox="0 0 36 36" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden>
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3" className="text-line" />
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              pathLength="100"
              strokeDasharray={`${progress} 100`}
              className={progressTone}
            />
          </svg>
          <span className={remaining < 0 ? 'text-danger' : undefined}>{remaining}</span>
        </span>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </form>
  );
}
