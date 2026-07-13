'use client';

import Link from 'next/link';
import { Fragment } from 'react';

// Transforma @menções e #hashtags em links dentro do texto de um post/resposta.
export function LinkedContent({ content }: { content: string }) {
  const pieces = content.split(/(@[a-z0-9][a-z0-9-]{1,59}|#[\p{L}\p{N}_]{1,50})/giu);
  return pieces.map((piece, index) => {
    if (piece.startsWith('@')) {
      const handle = piece.slice(1);
      return <Link key={`${piece}-${index}`} href={`/u/${handle}`} onClick={(e) => e.stopPropagation()} className="font-semibold text-brand hover:underline">{piece}</Link>;
    }
    if (piece.startsWith('#')) {
      const tag = piece.slice(1);
      return <Link key={`${piece}-${index}`} href={`/rede?hashtag=${encodeURIComponent(tag)}`} onClick={(e) => e.stopPropagation()} className="font-semibold text-brand hover:underline">{piece}</Link>;
    }
    return <Fragment key={index}>{piece}</Fragment>;
  });
}
