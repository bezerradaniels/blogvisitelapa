// Tipos de domínio de publicidade.
import type { AdPlacement, Tables } from './database';

export type AdContract = Tables<'ad_contracts'>;
export type StandaloneProduct = Tables<'standalone_products'>;
export type CommercialClient = Tables<'commercial_clients'>;

export type { AdPlacement };

// Anúncio pronto para exibição (saída de get_active_ads).
export interface ResolvedAd {
  id: string;
  title: string;
  placement: AdPlacement;
  banner_url: string | null;
  link_url: string | null;
  company_name: string | null;
  priority: number;
}
