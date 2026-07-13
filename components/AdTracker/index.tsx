'use client';

import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Props {
  campaignId: string;
  href?: string | null;
  children: ReactNode;
  className?: string;
}

// O banco ignora chamadas para campanhas inativas ou sem tracking habilitado;
// assim este componente nunca expõe contratos nem registra eventos inválidos.
export default function AdTracker({ campaignId, href, children, className }: Props) {
  useEffect(() => {
    const supabase = createClient();
    void supabase.rpc('record_ad_event', { p_campaign_id: campaignId, p_event: 'impression' });
  }, [campaignId]);

  function click() {
    const supabase = createClient();
    void supabase.rpc('record_ad_event', { p_campaign_id: campaignId, p_event: 'click' });
  }

  if (href) {
    return <a href={href} target="_blank" rel="noopener sponsored nofollow" onClick={click} className={className}>{children}</a>;
  }
  return <div className={className}>{children}</div>;
}
