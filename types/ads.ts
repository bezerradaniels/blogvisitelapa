// Tipos de domínio de publicidade.
import type { AdPlacement } from './database';

export type { AdPlacement };

// Anúncio pronto para exibição (saída de get_active_ads).
export interface ResolvedAd {
  id: string;
  title: string;
  placement: AdPlacement;
  banner_url: string | null;
  mobile_banner_url?: string | null;
  link_url: string | null;
  company_name: string | null;
  alternative_text?: string | null;
  priority: number;
  tracking_enabled?: boolean;
}
