'use client';

// Botão de favoritar (apenas para usuários logados).
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import Icon from '@/components/Icon';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils/cn';

interface FavoriteButtonProps {
  postId: string;
  profileId: string | null; // null = não logado
  initialFavorited: boolean;
}

export default function FavoriteButton({ postId, profileId, initialFavorited }: FavoriteButtonProps) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, start] = useTransition();

  function toggle() {
    if (!profileId) {
      router.push(`/login?redirect=/post`);
      return;
    }
    const supabase = createClient();
    start(async () => {
      if (favorited) {
        await supabase.from('favorites').delete().eq('post_id', postId).eq('user_id', profileId);
        setFavorited(false);
      } else {
        await supabase.from('favorites').insert({ post_id: postId, user_id: profileId });
        setFavorited(true);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={favorited}
      className={cn(
        'inline-flex items-center gap-2 rounded border px-3 py-2 text-sm font-medium transition-colors',
        favorited ? 'border-brand bg-brand-soft text-brand-dark' : 'border-line text-body hover:bg-surface',
      )}
    >
      <Icon icon="FavouriteIcon" size={18} />
      {favorited ? 'Salvo nos favoritos' : 'Salvar nos favoritos'}
    </button>
  );
}
