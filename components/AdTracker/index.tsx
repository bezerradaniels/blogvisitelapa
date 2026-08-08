'use client';

import { useEffect } from 'react';
import type { ReactNode } from 'react';

interface Props {
  campaignId: string;
  href?: string | null;
  children: ReactNode;
  className?: string;
}

// O banco ignora chamadas para campanhas inativas ou sem tracking habilitado;
// assim este componente nunca expõe contratos nem registra eventos inválidos.
export default function AdTracker({ campaignId, href, children, className }: Props) {
  function record(event: 'impression' | 'click') {
    void fetch('/api/ads/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignId, event }),
      credentials: 'same-origin',
      keepalive: true,
    });
  }

  useEffect(() => {
    record('impression');
    // Registra uma vez por montagem/campanha.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  function click() {
    record('click');
  }

  if (href) {
    return <a href={href} target="_blank" rel="noopener sponsored nofollow" onClick={click} className={className}>{children}</a>;
  }
  return <div className={className}>{children}</div>;
}
