'use client';

// Comentários: lista os aprovados e permite enviar (entra como "pendente").
import { useState, useTransition } from 'react';
import Button from '@/components/Button';
import { createClient } from '@/lib/supabase/client';
import { formatDate, titleCase } from '@/lib/utils/format';
import type { CommentWithAuthor } from '@/types/posts';

interface CommentsProps {
  postId: string;
  profileId: string | null;
  initialComments: CommentWithAuthor[];
}

export default function Comments({ postId, profileId, initialComments }: CommentsProps) {
  const [content, setContent] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const text = content.trim();
    if (text.length < 2) {
      setError('Escreva um comentário.');
      return;
    }
    const supabase = createClient();
    start(async () => {
      const { error: err } = await supabase
        .from('comments')
        .insert({ post_id: postId, user_id: profileId!, content: text });
      if (err) {
        setError('Não foi possível enviar. Tente novamente.');
        return;
      }
      setContent('');
      setSent(true);
    });
  }

  return (
    <section aria-label="Comentários" className="space-y-4">
      <h2 className="text-base font-bold text-title md:text-lg">Comentários</h2>

      {profileId ? (
        sent ? (
          <p className="card-base bg-brand-soft p-3 text-sm text-brand-dark">
            Comentário enviado! Ele será exibido após aprovação da moderação.
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-2">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              maxLength={4000}
              placeholder="Escreva seu comentário..."
              className="w-full rounded border border-line bg-card p-3 text-sm outline-none focus:border-brand"
            />
            {error && <p className="text-xs text-danger">{error}</p>}
            <Button size="sm" variant="primary">
              {pending ? 'Enviando...' : 'Enviar comentário'}
            </Button>
          </form>
        )
      ) : (
        <div className="card-base flex flex-col items-start gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            Entre na sua conta para deixar um comentário. Todos passam por moderação.
          </p>
          <Button href="/login" size="sm" variant="primary" className="shrink-0">
            Entrar para comentar
          </Button>
        </div>
      )}

      <ul className="space-y-3">
        {initialComments.length === 0 ? (
          <li className="text-sm text-muted">Ainda não há comentários aprovados.</li>
        ) : (
          initialComments.map((c) => (
            <li key={c.id} className="card-base flex gap-3 p-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft font-headline text-sm font-extrabold text-brand-dark">
                {(c.author?.full_name ?? 'L').charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <div className="mb-0.5 flex items-center gap-2 text-xs text-muted">
                  <span className="font-bold text-title">{titleCase(c.author?.full_name) || 'Leitor'}</span>
                  <time dateTime={c.created_at}>{formatDate(c.created_at)}</time>
                </div>
                <p className="text-sm text-body">{c.content}</p>
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
