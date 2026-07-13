import type {
  AdContractStatus,
  AdPlacement,
  CampaignStatus,
  ContractDiscountType,
  PaymentStatus,
} from '@/types/database';

export interface CommercialClientOption {
  id: string;
  client_name: string;
  trade_name: string | null;
  company_name: string | null;
  email: string | null;
  whatsapp: string | null;
  document: string | null;
  is_active: boolean;
}

export interface CommercialBrandOption {
  id: string;
  client_id: string;
  name: string;
  is_active: boolean;
}

export interface CommercialProductOption {
  id: string;
  name: string;
  default_price: number;
  placement_id: string | null;
  placement_code: AdPlacement | null;
  requires_media_upload: boolean;
  requires_content_creation: boolean;
  is_recurring: boolean;
}

export interface CommercialPlacementOption {
  id: string;
  code: AdPlacement;
  name: string;
  desktop_dimensions: string | null;
  mobile_dimensions: string | null;
  requires_media?: boolean;
}

export interface ContractItemDraft {
  productId?: string | null;
  customName: string;
  description?: string;
  quantity: number;
  unitPriceCents: number;
  discountCents: number;
  startDate?: string;
  endDate?: string;
  placement?: AdPlacement | '';
  placementId?: string | null;
  requiresMediaUpload: boolean;
  requiresContentCreation: boolean;
  notes?: string;
}

export interface CampaignDraft {
  itemIndex: number;
  campaignName: string;
  placement: AdPlacement;
  placementId?: string | null;
  desktopMediaUrl?: string;
  mobileMediaUrl?: string;
  alternativeText?: string;
  destinationUrl?: string;
  startAt: string;
  endAt: string;
  priority: number;
  rotationWeight: number;
  isVisible: boolean;
  clickTrackingEnabled: boolean;
  impressionTrackingEnabled: boolean;
  status: CampaignStatus;
}

export interface PaymentDraft {
  installmentNumber: number;
  description?: string;
  amountCents: number;
  paidAmountCents?: number;
  dueDate: string;
  paymentMethod?: string;
  status?: PaymentStatus;
  notes?: string;
}

export interface CommercialContractDraft {
  id?: string;
  clientId: string;
  advertiserId?: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  internalNotes?: string;
  clientNotes?: string;
  renewalEnabled: boolean;
  renewalPeriodDays?: number;
  renewalNoticeDays: number;
  contractDiscountType?: ContractDiscountType | '';
  /** Centavos quando o tipo é valor; percentual (0–100) quando o tipo é percentual. */
  contractDiscountValue: number;
  additionalCostsCents: number;
  paymentMethod?: string;
  paymentTerms?: string;
  installmentCount: number;
  billingDueDate?: string;
  items: ContractItemDraft[];
  campaigns: CampaignDraft[];
  payments: PaymentDraft[];
  status: AdContractStatus;
}

export interface ContractListRow {
  id: string;
  contract_number: string | null;
  title: string;
  client_name: string;
  advertiser_name: string | null;
  start_date: string;
  end_date: string;
  status: AdContractStatus;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  overdue_amount: number;
  next_due_date: string | null;
}

export interface ContractFinancialSummary {
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  cancelledAmount: number;
  refundedAmount: number;
  nextDueDate: string | null;
}
