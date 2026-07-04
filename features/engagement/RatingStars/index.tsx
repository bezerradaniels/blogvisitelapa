'use client';

// Avaliação por estrelas (1–5). Impede duplicidade via upsert (unique post+user).
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import Icon from '@/components/Icon';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils/cn';

interface RatingStarsProps {
  postId: string;
  profileId: string | null;
  initialUserRating: number | null;
  average: number;
  count: number;
}

export default function RatingStars({
  postId,
  profileId,
  initialUserRating,
  average,
  count,
}: RatingStarsProps) {
  const router = useRouter();
  const [userRating, setUserRating] = useState(initialUserRating ?? 0);
  const [hover, setHover] = useState(0);
  const [pending, start] = useTransition();

  function rate(value: number) {
    if (!profileId) {
      router.push('/login');
      return;
    }
    const supabase = createClient();
    start(async () => {
      await supabase
        .from('ratings')
        .upsert({ post_id: postId, user_id: profileId, rating: value }, { onConflict: 'post_id,user_id' });
      setUserRating(value);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1" role="radiogroup" aria-label="Avaliar conteúdo">
        {[1, 2, 3, 4, 5].map((star) => {
          const active = (hover || userRating) >= star;
          return (
            <button
              key={star}
              type="button"
              disabled={pending}
              aria-label={`${star} estrela${star > 1 ? 's' : ''}`}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              onClick={() => rate(star)}
              className={cn('transition-colors', active ? 'text-amber-500' : 'text-slate-300')}
            >
              <Icon icon="StarIcon" size={24} strokeWidth={active ? 0 : 1.8} />
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted">
        {count > 0 ? `${average.toFixed(1)} · ${count} avaliação${count > 1 ? 'ões' : ''}` : 'Seja o primeiro a avaliar'}
      </p>
    </div>
  );
}
