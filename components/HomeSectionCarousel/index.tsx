'use client';

import { useRef } from 'react';
import PostCard from '@/components/PostCard';
import type { PostWithRelations } from '@/types/posts';

export default function HomeSectionCarousel({ posts }: { posts: PostWithRelations[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (amount: number) => ref.current?.scrollBy({ left: amount, behavior: 'smooth' });
  return (
    <div className="group/carousel relative">
      <div ref={ref} tabIndex={0} className="flex snap-x snap-mandatory gap-[18px] overflow-x-auto pb-2 pr-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 motion-reduce:scroll-auto" aria-label="Posts da seção">
        {posts.map((post) => <div key={post.id} className="w-[78vw] shrink-0 snap-start sm:w-[300px]"><PostCard post={post} /></div>)}
      </div>
      <div className="mt-2 flex justify-end gap-2">
        <button type="button" onClick={() => scroll(-320)} className="rounded-full border border-line px-3 py-1 text-sm font-bold text-body focus-visible:ring-2 focus-visible:ring-brand/40" aria-label="Posts anteriores">←</button>
        <button type="button" onClick={() => scroll(320)} className="rounded-full border border-line px-3 py-1 text-sm font-bold text-body focus-visible:ring-2 focus-visible:ring-brand/40" aria-label="Próximos posts">→</button>
      </div>
    </div>
  );
}
