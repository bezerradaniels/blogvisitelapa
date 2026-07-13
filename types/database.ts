// Tipos do banco Supabase (mantidos em sincronia com supabase/migrations).
// Para regenerar a partir do projeto remoto:
//   supabase gen types typescript --project-id <ref> --schema public > types/database.generated.ts
// Este arquivo é a fonte usada pelos clients; ajuste-o se alterar o schema.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ---- Enums ----------------------------------------------------------
export type UserRole = 'common_user' | 'publisher' | 'admin';
export type AccountStatus =
  | 'active'
  | 'suspended'
  | 'pending'
  | 'deactivated'
  | 'pending_deletion';
export type PostStatus =
  | 'rascunho'
  | 'enviado_para_revisao'
  | 'publicado'
  | 'arquivado'
  | 'removido';
export type ModerationStatus = 'pendente' | 'aprovado' | 'rejeitado';
export type ContentType =
  | 'noticia'
  | 'evento'
  | 'guia'
  | 'publieditorial'
  | 'conteudo_patrocinado'
  | 'comunidade'
  | 'turismo'
  | 'religiosidade';
export type CategoryType = 'editorial' | 'guia' | 'institucional';
export type CommentStatus = 'pendente' | 'aprovado' | 'rejeitado' | 'removido';
export type ContactStatus = 'novo' | 'lido' | 'em_atendimento' | 'concluido' | 'arquivado';
export type CommercialStatus = 'ativo' | 'inativo' | 'prospecto';
export type PaymentStatus = 'pendente' | 'parcial' | 'pago' | 'atrasado' | 'cancelado' | 'estornado';
export type DeliveryStatus = 'pendente' | 'em_producao' | 'entregue' | 'cancelado';
export type AdContractStatus =
  | 'rascunho'
  | 'pendente_aprovacao'
  | 'aprovado'
  | 'agendado'
  | 'ativo'
  | 'pausado'
  | 'expirado'
  | 'concluido'
  | 'removido'
  | 'cancelado';
export type CommercialClientType = 'pessoa_fisica' | 'empresa' | 'agencia' | 'instituicao_publica';
export type ContractDiscountType = 'valor' | 'percentual';
export type ContractItemDeliveryStatus =
  | 'nao_configurado'
  | 'aguardando_materiais'
  | 'pronto'
  | 'agendado'
  | 'em_andamento'
  | 'entregue'
  | 'pausado'
  | 'cancelado';
export type CampaignStatus =
  | 'rascunho'
  | 'aguardando_midia'
  | 'em_revisao'
  | 'agendada'
  | 'ativa'
  | 'pausada'
  | 'expirada'
  | 'rejeitada'
  | 'cancelada';
export type AdPlacement =
  | 'home_top'
  | 'home_middle'
  | 'home_carousel'
  | 'post_sidebar'
  | 'post_inline_mobile'
  | 'category_top'
  | 'event_sidebar'
  | 'fixed_carousel_sponsor';
// Comunidades (área social)
export type CommunityStatus = 'ativa' | 'suspensa' | 'removida';
export type CommunityRole = 'dono' | 'moderador' | 'membro';
export type CommunityPostStatus = 'visivel' | 'removido';
export type ReportReason = 'spam' | 'ofensivo' | 'off_topic' | 'ilegal' | 'outro';
export type ReportStatus = 'aberta' | 'resolvida' | 'descartada';
export type CommunityCategory =
  | 'cidade'
  | 'religiosidade'
  | 'cultura'
  | 'esportes'
  | 'gastronomia'
  | 'educacao'
  | 'negocios'
  | 'humor'
  | 'outros';
export type CommunityReportTarget = 'comunidade' | 'topico' | 'resposta';
// Perfis sociais
export type ProfileVisibility = 'publico' | 'amigos' | 'oculto';
export type InteractionAudience = 'todos' | 'amigos_de_amigos' | 'amigos' | 'ninguem';
export type FriendshipStatus = 'pendente' | 'aceito';
export type TestimonialStatus = 'pendente' | 'aprovado' | 'oculto';
export type NotificationType =
  | 'amizade_pedido'
  | 'amizade_aceita'
  | 'recado'
  | 'depoimento'
  | 'mensagem';

// Helper para descrever uma tabela com defaults gerados no banco.
type WithTimestamps = {
  created_at: string;
  updated_at: string;
};

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          full_name: string | null;
          slug: string | null;
          avatar_url: string | null;
          phone: string | null;
          role: UserRole;
          bio: string | null;
          status: AccountStatus;
          deactivated_at: string | null;
          deletion_requested_at: string | null;
          deletion_reason: string | null;
        } & WithTimestamps;
        Insert: {
          id?: string;
          user_id: string;
          full_name?: string | null;
          slug?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          role?: UserRole;
          bio?: string | null;
          status?: AccountStatus;
          deactivated_at?: string | null;
          deletion_requested_at?: string | null;
          deletion_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          type: CategoryType;
          is_fixed_carousel_item: boolean;
          icon_name: string | null;
          image_url: string | null;
          parent_id: string | null;
          sort_order: number;
          status: AccountStatus;
        } & WithTimestamps;
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          type?: CategoryType;
          is_fixed_carousel_item?: boolean;
          icon_name?: string | null;
          image_url?: string | null;
          parent_id?: string | null;
          sort_order?: number;
          status?: AccountStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['categories']['Insert']>;
        Relationships: [];
      };
      tags: {
        Row: { id: string; name: string; slug: string } & WithTimestamps;
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['tags']['Insert']>;
        Relationships: [];
      };
      posts: {
        Row: {
          id: string;
          title: string;
          subtitle: string | null;
          slug: string;
          excerpt: string | null;
          content_html: string | null;
          content_json: Json | null;
          cover_image_url: string | null;
          cover_image_alt: string | null;
          category_id: string | null;
          author_id: string;
          reviewed_by: string | null;
          status: PostStatus;
          moderation_status: ModerationStatus;
          content_type: ContentType;
          is_featured: boolean;
          is_sponsored: boolean;
          is_event: boolean;
          event_start_date: string | null;
          event_end_date: string | null;
          event_location: string | null;
          event_address: string | null;
          event_ticket_url: string | null;
          event_organizer: string | null;
          event_map_url: string | null;
          event_is_free: boolean;
          source_note: string | null;
          editorial_notes: string | null;
          seo_title: string | null;
          seo_description: string | null;
          focus_keyword: string | null;
          local_seo_keyword: string | null;
          social_title: string | null;
          social_description: string | null;
          social_image_url: string | null;
          allow_indexing: boolean;
          include_in_sitemap: boolean;
          include_in_rss: boolean;
          rating_avg: number;
          rating_count: number;
          views_count: number;
          published_at: string | null;
        } & WithTimestamps;
        Insert: {
          id?: string;
          title: string;
          subtitle?: string | null;
          slug: string;
          excerpt?: string | null;
          content_html?: string | null;
          content_json?: Json | null;
          cover_image_url?: string | null;
          cover_image_alt?: string | null;
          category_id?: string | null;
          author_id: string;
          reviewed_by?: string | null;
          status?: PostStatus;
          moderation_status?: ModerationStatus;
          content_type?: ContentType;
          is_featured?: boolean;
          is_sponsored?: boolean;
          is_event?: boolean;
          event_start_date?: string | null;
          event_end_date?: string | null;
          event_location?: string | null;
          event_address?: string | null;
          event_ticket_url?: string | null;
          event_organizer?: string | null;
          event_map_url?: string | null;
          event_is_free?: boolean;
          source_note?: string | null;
          editorial_notes?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          focus_keyword?: string | null;
          local_seo_keyword?: string | null;
          social_title?: string | null;
          social_description?: string | null;
          social_image_url?: string | null;
          allow_indexing?: boolean;
          include_in_sitemap?: boolean;
          include_in_rss?: boolean;
          rating_avg?: number;
          rating_count?: number;
          views_count?: number;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['posts']['Insert']>;
        Relationships: [];
      };
      post_tags: {
        Row: { post_id: string; tag_id: string };
        Insert: { post_id: string; tag_id: string };
        Update: Partial<{ post_id: string; tag_id: string }>;
        Relationships: [];
      };
      post_images: {
        Row: { id: string; post_id: string; url: string; alt: string | null; created_at: string };
        Insert: {
          id?: string;
          post_id: string;
          url: string;
          alt?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['post_images']['Insert']>;
        Relationships: [];
      };
      post_gallery: {
        Row: {
          id: string;
          post_id: string;
          url: string;
          alt: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          url: string;
          alt?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['post_gallery']['Insert']>;
        Relationships: [];
      };
      related_posts: {
        Row: { post_id: string; related_post_id: string; sort_order: number };
        Insert: { post_id: string; related_post_id: string; sort_order?: number };
        Update: Partial<{ post_id: string; related_post_id: string; sort_order: number }>;
        Relationships: [];
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          parent_id: string | null;
          content: string;
          status: CommentStatus;
        } & WithTimestamps;
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          parent_id?: string | null;
          content: string;
          status?: CommentStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['comments']['Insert']>;
        Relationships: [];
      };
      ratings: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          rating: number;
        } & WithTimestamps;
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          rating: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['ratings']['Insert']>;
        Relationships: [];
      };
      favorites: {
        Row: { id: string; post_id: string; user_id: string; created_at: string };
        Insert: { id?: string; post_id: string; user_id: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['favorites']['Insert']>;
        Relationships: [];
      };
      contacts: {
        Row: {
          id: string;
          name: string;
          email: string;
          whatsapp: string | null;
          subject: string | null;
          message: string;
          status: ContactStatus;
        } & WithTimestamps;
        Insert: {
          id?: string;
          name: string;
          email: string;
          whatsapp?: string | null;
          subject?: string | null;
          message: string;
          status?: ContactStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['contacts']['Insert']>;
        Relationships: [];
      };
      advertiser_contacts: {
        Row: {
          id: string;
          name: string;
          company_name: string | null;
          segment: string | null;
          email: string;
          whatsapp: string | null;
          ad_type: string | null;
          budget_range: string | null;
          message: string | null;
          status: ContactStatus;
        } & WithTimestamps;
        Insert: {
          id?: string;
          name: string;
          company_name?: string | null;
          segment?: string | null;
          email: string;
          whatsapp?: string | null;
          ad_type?: string | null;
          budget_range?: string | null;
          message?: string | null;
          status?: ContactStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['advertiser_contacts']['Insert']>;
        Relationships: [];
      };
      commercial_clients: {
        Row: {
          id: string;
          client_name: string;
          company_name: string | null;
          segment: string | null;
          email: string | null;
          whatsapp: string | null;
          document: string | null;
          notes: string | null;
          status: CommercialStatus;
          client_type: CommercialClientType;
          legal_name: string | null;
          trade_name: string | null;
          primary_contact_name: string | null;
          billing_email: string | null;
          website: string | null;
          address: string | null;
          city: string | null;
          state: string | null;
          postal_code: string | null;
          is_active: boolean;
          archived_at: string | null;
        } & WithTimestamps;
        Insert: {
          id?: string;
          client_name: string;
          company_name?: string | null;
          segment?: string | null;
          email?: string | null;
          whatsapp?: string | null;
          document?: string | null;
          notes?: string | null;
          status?: CommercialStatus;
          client_type?: CommercialClientType;
          legal_name?: string | null;
          trade_name?: string | null;
          primary_contact_name?: string | null;
          billing_email?: string | null;
          website?: string | null;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          postal_code?: string | null;
          is_active?: boolean;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['commercial_clients']['Insert']>;
        Relationships: [];
      };
      client_history: {
        Row: {
          id: string;
          client_id: string;
          entry_type: string;
          title: string | null;
          content: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          entry_type?: string;
          title?: string | null;
          content?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['client_history']['Insert']>;
        Relationships: [];
      };
      ad_contracts: {
        Row: {
          id: string;
          contract_type: string | null;
          ad_type: string | null;
          title: string;
          client_id: string | null;
          company_name: string | null;
          start_date: string;
          end_date: string;
          negotiated_value: number | null;
          payment_method: string | null;
          payment_status: PaymentStatus;
          payment_notes: string | null;
          internal_notes: string | null;
          placement: AdPlacement | null;
          banner_url: string | null;
          link_url: string | null;
          status: AdContractStatus;
          priority: number;
          renewal_enabled: boolean;
          created_by: string | null;
          updated_by: string | null;
          contract_number: string | null;
          description: string | null;
          advertiser_id: string | null;
          subtotal: number;
          contract_discount_type: ContractDiscountType | null;
          contract_discount_value: number;
          additional_costs: number;
          total_amount: number;
          payment_terms: string | null;
          installment_count: number;
          billing_due_date: string | null;
          renewal_period_days: number | null;
          renewal_notice_days: number;
          client_notes: string | null;
          contract_file_url: string | null;
          approved_by: string | null;
          approved_at: string | null;
          previous_contract_id: string | null;
          archived_at: string | null;
          currency: string;
        } & WithTimestamps;
        Insert: {
          id?: string;
          contract_type?: string | null;
          ad_type?: string | null;
          title: string;
          client_id?: string | null;
          company_name?: string | null;
          start_date: string;
          end_date: string;
          negotiated_value?: number | null;
          payment_method?: string | null;
          payment_status?: PaymentStatus;
          payment_notes?: string | null;
          internal_notes?: string | null;
          placement?: AdPlacement | null;
          banner_url?: string | null;
          link_url?: string | null;
          status?: AdContractStatus;
          priority?: number;
          renewal_enabled?: boolean;
          created_by?: string | null;
          updated_by?: string | null;
          contract_number?: string | null;
          description?: string | null;
          advertiser_id?: string | null;
          subtotal?: number;
          contract_discount_type?: ContractDiscountType | null;
          contract_discount_value?: number;
          additional_costs?: number;
          total_amount?: number;
          payment_terms?: string | null;
          installment_count?: number;
          billing_due_date?: string | null;
          renewal_period_days?: number | null;
          renewal_notice_days?: number;
          client_notes?: string | null;
          contract_file_url?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          previous_contract_id?: string | null;
          archived_at?: string | null;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['ad_contracts']['Insert']>;
        Relationships: [];
      };
      commercial_brands: {
        Row: {
          id: string;
          client_id: string;
          name: string;
          logo_url: string | null;
          website: string | null;
          contact_name: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          notes: string | null;
          is_active: boolean;
        } & WithTimestamps;
        Insert: {
          id?: string;
          client_id: string;
          name: string;
          logo_url?: string | null;
          website?: string | null;
          contact_name?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          notes?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['commercial_brands']['Insert']>;
        Relationships: [];
      };
      advertising_placements: {
        Row: {
          id: string;
          code: AdPlacement;
          name: string;
          page_context: string;
          position: string;
          desktop_dimensions: string | null;
          mobile_dimensions: string | null;
          accepted_formats: string[];
          maximum_file_size: number;
          maximum_active_items: number;
          rotation_enabled: boolean;
          is_active: boolean;
          notes: string | null;
        } & WithTimestamps;
        Insert: {
          id?: string;
          code: AdPlacement;
          name: string;
          page_context: string;
          position: string;
          desktop_dimensions?: string | null;
          mobile_dimensions?: string | null;
          accepted_formats?: string[];
          maximum_file_size?: number;
          maximum_active_items?: number;
          rotation_enabled?: boolean;
          is_active?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['advertising_placements']['Insert']>;
        Relationships: [];
      };
      commercial_products: {
        Row: {
          id: string;
          name: string;
          slug: string;
          product_type: string;
          description: string | null;
          default_price: number;
          billing_model: string;
          default_duration_days: number | null;
          placement_id: string | null;
          requires_media_upload: boolean;
          requires_destination_url: boolean;
          requires_content_creation: boolean;
          is_recurring: boolean;
          is_active: boolean;
        } & WithTimestamps;
        Insert: {
          id?: string;
          name: string;
          slug: string;
          product_type?: string;
          description?: string | null;
          default_price?: number;
          billing_model?: string;
          default_duration_days?: number | null;
          placement_id?: string | null;
          requires_media_upload?: boolean;
          requires_destination_url?: boolean;
          requires_content_creation?: boolean;
          is_recurring?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['commercial_products']['Insert']>;
        Relationships: [];
      };
      contract_items: {
        Row: {
          id: string;
          contract_id: string;
          product_id: string | null;
          legacy_source_contract_id: string | null;
          custom_name: string;
          description: string | null;
          quantity: number;
          unit_price: number;
          discount_amount: number;
          line_total: number;
          start_date: string | null;
          end_date: string | null;
          placement: AdPlacement | null;
          placement_id: string | null;
          requires_media_upload: boolean;
          requires_content_creation: boolean;
          delivery_status: ContractItemDeliveryStatus;
          notes: string | null;
        } & WithTimestamps;
        Insert: {
          id?: string;
          contract_id: string;
          product_id?: string | null;
          legacy_source_contract_id?: string | null;
          custom_name: string;
          description?: string | null;
          quantity?: number;
          unit_price?: number;
          discount_amount?: number;
          start_date?: string | null;
          end_date?: string | null;
          placement?: AdPlacement | null;
          placement_id?: string | null;
          requires_media_upload?: boolean;
          requires_content_creation?: boolean;
          delivery_status?: ContractItemDeliveryStatus;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['contract_items']['Insert']>;
        Relationships: [];
      };
      ad_campaigns: {
        Row: {
          id: string;
          contract_id: string;
          contract_item_id: string | null;
          legacy_contract_id: string | null;
          client_id: string | null;
          advertiser_id: string | null;
          campaign_name: string;
          placement: AdPlacement;
          placement_id: string | null;
          desktop_media_url: string | null;
          mobile_media_url: string | null;
          alternative_text: string | null;
          destination_url: string | null;
          open_in_new_tab: boolean;
          start_at: string;
          end_at: string;
          priority: number;
          rotation_weight: number;
          status: CampaignStatus;
          is_visible: boolean;
          click_tracking_enabled: boolean;
          impression_tracking_enabled: boolean;
          published_at: string | null;
        } & WithTimestamps;
        Insert: {
          id?: string;
          contract_id: string;
          contract_item_id?: string | null;
          legacy_contract_id?: string | null;
          client_id?: string | null;
          advertiser_id?: string | null;
          campaign_name: string;
          placement: AdPlacement;
          placement_id?: string | null;
          desktop_media_url?: string | null;
          mobile_media_url?: string | null;
          alternative_text?: string | null;
          destination_url?: string | null;
          open_in_new_tab?: boolean;
          start_at: string;
          end_at: string;
          priority?: number;
          rotation_weight?: number;
          status?: CampaignStatus;
          is_visible?: boolean;
          click_tracking_enabled?: boolean;
          impression_tracking_enabled?: boolean;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['ad_campaigns']['Insert']>;
        Relationships: [];
      };
      contract_payments: {
        Row: {
          id: string;
          contract_id: string;
          legacy_contract_id: string | null;
          installment_number: number;
          description: string | null;
          amount: number;
          paid_amount: number;
          due_date: string;
          paid_at: string | null;
          payment_method: string | null;
          status: PaymentStatus;
          transaction_reference: string | null;
          receipt_url: string | null;
          notes: string | null;
        } & WithTimestamps;
        Insert: {
          id?: string;
          contract_id: string;
          legacy_contract_id?: string | null;
          installment_number?: number;
          description?: string | null;
          amount: number;
          paid_amount?: number;
          due_date: string;
          paid_at?: string | null;
          payment_method?: string | null;
          status?: PaymentStatus;
          transaction_reference?: string | null;
          receipt_url?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['contract_payments']['Insert']>;
        Relationships: [];
      };
      contract_files: {
        Row: {
          id: string;
          contract_id: string;
          file_type: 'contrato_assinado' | 'briefing' | 'proposta' | 'recibo' | 'midia' | 'outro';
          file_url: string;
          file_name: string | null;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          contract_id: string;
          file_type?: 'contrato_assinado' | 'briefing' | 'proposta' | 'recibo' | 'midia' | 'outro';
          file_url: string;
          file_name?: string | null;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['contract_files']['Insert']>;
        Relationships: [];
      };
      ad_assets: {
        Row: {
          id: string;
          contract_id: string;
          image_url: string;
          alt: string | null;
          width: number | null;
          height: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          contract_id: string;
          image_url: string;
          alt?: string | null;
          width?: number | null;
          height?: number | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['ad_assets']['Insert']>;
        Relationships: [];
      };
      contract_history: {
        Row: {
          id: string;
          contract_id: string;
          action: string;
          notes: string | null;
          previous_data: Json | null;
          new_data: Json | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          contract_id: string;
          action: string;
          notes?: string | null;
          previous_data?: Json | null;
          new_data?: Json | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['contract_history']['Insert']>;
        Relationships: [];
      };
      ad_impressions: {
        Row: {
          id: string;
          contract_id: string;
          campaign_id: string | null;
          placement: AdPlacement;
          utm: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          contract_id: string;
          campaign_id?: string | null;
          placement: AdPlacement;
          utm?: Json | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['ad_impressions']['Insert']>;
        Relationships: [];
      };
      ad_clicks: {
        Row: {
          id: string;
          contract_id: string;
          campaign_id: string | null;
          placement: AdPlacement;
          utm: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          contract_id: string;
          campaign_id?: string | null;
          placement: AdPlacement;
          utm?: Json | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['ad_clicks']['Insert']>;
        Relationships: [];
      };
      sponsored_articles: {
        Row: {
          id: string;
          post_id: string;
          contract_id: string | null;
          contract_item_id: string | null;
          client_id: string | null;
          label: string;
          start_date: string | null;
          end_date: string | null;
          is_active: boolean;
        } & WithTimestamps;
        Insert: {
          id?: string;
          post_id: string;
          contract_id?: string | null;
          contract_item_id?: string | null;
          client_id?: string | null;
          label?: string;
          start_date?: string | null;
          end_date?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['sponsored_articles']['Insert']>;
        Relationships: [];
      };
      sponsored_events: {
        Row: {
          id: string;
          post_id: string;
          contract_id: string | null;
          contract_item_id: string | null;
          client_id: string | null;
          label: string;
          start_date: string | null;
          end_date: string | null;
          is_active: boolean;
        } & WithTimestamps;
        Insert: {
          id?: string;
          post_id: string;
          contract_id?: string | null;
          contract_item_id?: string | null;
          client_id?: string | null;
          label?: string;
          start_date?: string | null;
          end_date?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['sponsored_events']['Insert']>;
        Relationships: [];
      };
      standalone_products: {
        Row: {
          id: string;
          product_name: string;
          description: string | null;
          price: number | null;
          client_id: string | null;
          company_name: string | null;
          payment_method: string | null;
          payment_status: PaymentStatus;
          delivery_status: DeliveryStatus;
          notes: string | null;
        } & WithTimestamps;
        Insert: {
          id?: string;
          product_name: string;
          description?: string | null;
          price?: number | null;
          client_id?: string | null;
          company_name?: string | null;
          payment_method?: string | null;
          payment_status?: PaymentStatus;
          delivery_status?: DeliveryStatus;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['standalone_products']['Insert']>;
        Relationships: [];
      };
      page_views: {
        Row: { id: string; path: string; referrer: string | null; created_at: string };
        Insert: { id?: string; path: string; referrer?: string | null; created_at?: string };
        Update: Partial<Database['public']['Tables']['page_views']['Insert']>;
        Relationships: [];
      };
      post_views: {
        Row: { id: string; post_id: string; created_at: string };
        Insert: { id?: string; post_id: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['post_views']['Insert']>;
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          entity: string | null;
          entity_id: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          action: string;
          entity?: string | null;
          entity_id?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>;
        Relationships: [];
      };
      settings: {
        Row: { key: string; value: Json; description: string | null; updated_at: string };
        Insert: { key: string; value?: Json; description?: string | null; updated_at?: string };
        Update: Partial<Database['public']['Tables']['settings']['Insert']>;
        Relationships: [];
      };
      newsletter_subscribers: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          confirmed: boolean;
          unsubscribed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          confirmed?: boolean;
          unsubscribed?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['newsletter_subscribers']['Insert']>;
        Relationships: [];
      };
      communities: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          slug: string;
          description: string | null;
          category: CommunityCategory;
          avatar_url: string | null;
          cover_image_url: string | null;
          rules: string | null;
          member_count: number;
          topic_count: number;
          status: CommunityStatus;
        } & WithTimestamps;
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          slug: string;
          description?: string | null;
          category?: CommunityCategory;
          avatar_url?: string | null;
          cover_image_url?: string | null;
          rules?: string | null;
          member_count?: number;
          topic_count?: number;
          status?: CommunityStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['communities']['Insert']>;
        Relationships: [];
      };
      community_members: {
        Row: {
          id: string;
          community_id: string;
          user_id: string;
          role: CommunityRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          community_id: string;
          user_id: string;
          role?: CommunityRole;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['community_members']['Insert']>;
        Relationships: [];
      };
      community_topics: {
        Row: {
          id: string;
          community_id: string;
          author_id: string;
          title: string;
          slug: string;
          content: string;
          is_pinned: boolean;
          is_locked: boolean;
          reply_count: number;
          last_activity_at: string;
          status: CommunityPostStatus;
        } & WithTimestamps;
        Insert: {
          id?: string;
          community_id: string;
          author_id: string;
          title: string;
          slug: string;
          content: string;
          is_pinned?: boolean;
          is_locked?: boolean;
          reply_count?: number;
          last_activity_at?: string;
          status?: CommunityPostStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['community_topics']['Insert']>;
        Relationships: [];
      };
      community_replies: {
        Row: {
          id: string;
          topic_id: string;
          author_id: string;
          content: string;
          status: CommunityPostStatus;
        } & WithTimestamps;
        Insert: {
          id?: string;
          topic_id: string;
          author_id: string;
          content: string;
          status?: CommunityPostStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['community_replies']['Insert']>;
        Relationships: [];
      };
      community_reports: {
        Row: {
          id: string;
          reporter_id: string;
          target_type: CommunityReportTarget;
          target_id: string;
          reason: ReportReason;
          details: string | null;
          status: ReportStatus;
          resolved_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          target_type: CommunityReportTarget;
          target_id: string;
          reason: ReportReason;
          details?: string | null;
          status?: ReportStatus;
          resolved_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['community_reports']['Insert']>;
        Relationships: [];
      };
      profile_details: {
        Row: {
          profile_id: string;
          visibility: ProfileVisibility;
          nickname: string | null;
          city: string | null;
          birth_date: string | null;
          relationship: string | null;
          interests: string | null;
          about: string | null;
          cover_url: string | null;
        } & WithTimestamps;
        Insert: {
          profile_id: string;
          visibility?: ProfileVisibility;
          nickname?: string | null;
          city?: string | null;
          birth_date?: string | null;
          relationship?: string | null;
          interests?: string | null;
          about?: string | null;
          cover_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profile_details']['Insert']>;
        Relationships: [];
      };
      user_privacy_settings: {
        Row: {
          profile_id: string;
          search_visibility: ProfileVisibility;
          allow_search_indexing: boolean;
          friend_list_visibility: ProfileVisibility;
          community_list_visibility: ProfileVisibility;
          activity_visibility: ProfileVisibility;
          online_status_visibility: ProfileVisibility;
          friend_request_permission: InteractionAudience;
          message_permission: InteractionAudience;
        } & WithTimestamps;
        Insert: {
          profile_id: string;
          search_visibility?: ProfileVisibility;
          allow_search_indexing?: boolean;
          friend_list_visibility?: ProfileVisibility;
          community_list_visibility?: ProfileVisibility;
          activity_visibility?: ProfileVisibility;
          online_status_visibility?: ProfileVisibility;
          friend_request_permission?: InteractionAudience;
          message_permission?: InteractionAudience;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['user_privacy_settings']['Insert']>;
        Relationships: [];
      };
      user_field_visibility: {
        Row: {
          profile_id: string;
          field_key: string;
          visibility: ProfileVisibility;
          updated_at: string;
        };
        Insert: {
          profile_id: string;
          field_key: string;
          visibility: ProfileVisibility;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['user_field_visibility']['Insert']>;
        Relationships: [];
      };
      user_notification_prefs: {
        Row: {
          profile_id: string;
          inapp_amizade: boolean;
          inapp_recado: boolean;
          inapp_depoimento: boolean;
          inapp_mensagem: boolean;
          email_enabled: boolean;
        } & WithTimestamps;
        Insert: {
          profile_id: string;
          inapp_amizade?: boolean;
          inapp_recado?: boolean;
          inapp_depoimento?: boolean;
          inapp_mensagem?: boolean;
          email_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['user_notification_prefs']['Insert']>;
        Relationships: [];
      };
      user_content_prefs: {
        Row: {
          profile_id: string;
          muted_words: string[];
          autoplay_videos: boolean;
          hide_sensitive: boolean;
          default_album_visibility: ProfileVisibility;
        } & WithTimestamps;
        Insert: {
          profile_id: string;
          muted_words?: string[];
          autoplay_videos?: boolean;
          hide_sensitive?: boolean;
          default_album_visibility?: ProfileVisibility;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['user_content_prefs']['Insert']>;
        Relationships: [];
      };
      social_posts: {
        Row: {
          id: string;
          author_id: string;
          content: string | null;
          repost_of: string | null;
          like_count: number;
          repost_count: number;
        } & WithTimestamps;
        Insert: {
          id?: string;
          author_id: string;
          content?: string | null;
          repost_of?: string | null;
          like_count?: number;
          repost_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['social_posts']['Insert']>;
        Relationships: [];
      };
      social_post_likes: {
        Row: { post_id: string; profile_id: string; created_at: string };
        Insert: { post_id: string; profile_id: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['social_post_likes']['Insert']>;
        Relationships: [];
      };
      social_post_mentions: {
        Row: { post_id: string; profile_id: string; created_at: string };
        Insert: { post_id: string; profile_id: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['social_post_mentions']['Insert']>;
        Relationships: [];
      };
      social_post_hashtags: {
        Row: { post_id: string; tag: string; created_at: string };
        Insert: { post_id: string; tag: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['social_post_hashtags']['Insert']>;
        Relationships: [];
      };
      friendships: {
        Row: {
          id: string;
          requester_id: string;
          addressee_id: string;
          status: FriendshipStatus;
        } & WithTimestamps;
        Insert: {
          id?: string;
          requester_id: string;
          addressee_id: string;
          status?: FriendshipStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['friendships']['Insert']>;
        Relationships: [];
      };
      scraps: {
        Row: {
          id: string;
          profile_id: string;
          author_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          author_id: string;
          content: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['scraps']['Insert']>;
        Relationships: [];
      };
      testimonials: {
        Row: {
          id: string;
          profile_id: string;
          author_id: string;
          content: string;
          status: TestimonialStatus;
        } & WithTimestamps;
        Insert: {
          id?: string;
          profile_id: string;
          author_id: string;
          content: string;
          status?: TestimonialStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['testimonials']['Insert']>;
        Relationships: [];
      };
      blocks: {
        Row: { id: string; blocker_id: string; blocked_id: string; created_at: string };
        Insert: { id?: string; blocker_id: string; blocked_id: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['blocks']['Insert']>;
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          participant_a: string;
          participant_b: string;
          last_message_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          participant_a: string;
          participant_b: string;
          last_message_at?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['conversations']['Insert']>;
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          read_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          recipient_id: string;
          actor_id: string | null;
          type: NotificationType;
          entity_id: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipient_id: string;
          actor_id?: string | null;
          type: NotificationType;
          entity_id?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
        Relationships: [];
      };
      photo_albums: {
        Row: {
          id: string;
          profile_id: string;
          title: string;
          cover_url: string | null;
          visibility: ProfileVisibility;
        } & WithTimestamps;
        Insert: {
          id?: string;
          profile_id: string;
          title: string;
          cover_url?: string | null;
          visibility?: ProfileVisibility;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['photo_albums']['Insert']>;
        Relationships: [];
      };
      photos: {
        Row: {
          id: string;
          album_id: string;
          profile_id: string;
          url: string;
          caption: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          album_id: string;
          profile_id: string;
          url: string;
          caption?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['photos']['Insert']>;
        Relationships: [];
      };
      home_sections: {
        Row: {
          id: string; title: string; subtitle: string | null; description: string | null; slug: string;
          status: 'active' | 'inactive'; display_order: number;
          placement_zone: 'after-hero' | 'after-latest-news' | 'before-events' | 'before-footer';
          selection_mode: 'manual' | 'automatic'; show_view_all: boolean;
          view_all_mode: 'internal' | 'custom' | 'hidden'; custom_view_all_url: string | null;
          cover_image_url: string | null; cover_image_alt: string | null; automatic_rules: Json | null;
          created_by: string | null; updated_by: string | null; deleted_at: string | null;
        } & WithTimestamps;
        Insert: {
          id?: string; title: string; subtitle?: string | null; description?: string | null; slug: string;
          status?: 'active' | 'inactive'; display_order?: number;
          placement_zone?: 'after-hero' | 'after-latest-news' | 'before-events' | 'before-footer';
          selection_mode?: 'manual' | 'automatic'; show_view_all?: boolean;
          view_all_mode?: 'internal' | 'custom' | 'hidden'; custom_view_all_url?: string | null;
          cover_image_url?: string | null; cover_image_alt?: string | null; automatic_rules?: Json | null;
          created_by?: string | null; updated_by?: string | null; deleted_at?: string | null;
          created_at?: string; updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['home_sections']['Insert']>;
        Relationships: [];
      };
      home_section_posts: {
        Row: { section_id: string; post_id: string; display_order: number; created_at: string; updated_at: string };
        Insert: { section_id: string; post_id: string; display_order?: number; created_at?: string; updated_at?: string };
        Update: Partial<Database['public']['Tables']['home_section_posts']['Insert']>;
        Relationships: [];
      };
    };
    Views: {
      active_ads: {
        Row: {
          id: string;
          title: string;
          placement: AdPlacement;
          banner_url: string | null;
          link_url: string | null;
          company_name: string | null;
          priority: number;
          start_date: string;
          end_date: string;
          contract_id: string;
        };
        Relationships: [];
      };
    };
    Functions: {
      get_active_ads: {
        Args: { p_placement: AdPlacement };
        Returns: {
          id: string;
          title: string;
          placement: AdPlacement;
          banner_url: string | null;
          link_url: string | null;
          company_name: string | null;
          priority: number;
        }[];
      };
      register_post_view: { Args: { p_post_id: string }; Returns: undefined };
      replace_home_section_posts: { Args: { p_section_id: string; p_post_ids: string[] }; Returns: undefined };
      admin_metrics_guarded: { Args: Record<string, never>; Returns: Json };
      expire_contracts: { Args: Record<string, never>; Returns: number };
      sync_commercial_statuses: { Args: Record<string, never>; Returns: Json };
      recalculate_contract_totals: { Args: { p_contract_id: string }; Returns: undefined };
      create_commercial_contract: { Args: { p_payload: Json }; Returns: string };
      transition_commercial_contract_status: {
        Args: { p_contract_id: string; p_new_status: string; p_notes?: string | null };
        Returns: undefined;
      };
      get_sponsor_label: { Args: { p_post_id: string }; Returns: string | null };
      record_ad_event: {
        Args: { p_campaign_id: string; p_event: string; p_utm?: Json | null };
        Returns: undefined;
      };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      is_publisher_or_admin: { Args: Record<string, never>; Returns: boolean };
      is_community_member: { Args: { cid: string }; Returns: boolean };
      is_community_owner: { Args: { cid: string }; Returns: boolean };
      is_community_moderator: { Args: { cid: string }; Returns: boolean };
      current_profile_id: { Args: Record<string, never>; Returns: string };
      are_friends: { Args: { a: string; b: string }; Returns: boolean };
      can_view_profile: { Args: { target: string }; Returns: boolean };
      can_view_field: { Args: { p_owner: string; p_key: string }; Returns: boolean };
      effective_field_visibility: {
        Args: { p_owner: string; p_key: string };
        Returns: ProfileVisibility;
      };
      visible_profile_details: { Args: { p_target: string }; Returns: Json };
      visible_profile_details_as: { Args: { p_target: string; p_audience: string }; Returns: Json };
      are_friends_of_friends: { Args: { a: string; b: string }; Returns: boolean };
      can_request_friendship: { Args: { p_target: string }; Returns: boolean };
      can_message: { Args: { p_target: string }; Returns: boolean };
      profile_allows_indexing: { Args: { p_target: string }; Returns: boolean };
      can_view_album: { Args: { p_album: string }; Returns: boolean };
      is_blocked: { Args: { a: string; b: string }; Returns: boolean };
      is_conversation_participant: { Args: { cid: string }; Returns: boolean };
      push_notification: {
        Args: { p_recipient: string; p_type: NotificationType; p_entity: string | null };
        Returns: undefined;
      };
      remove_friendship: { Args: { p_other: string }; Returns: undefined };
    };
    Enums: {
      user_role: UserRole;
      account_status: AccountStatus;
      post_status: PostStatus;
      moderation_status: ModerationStatus;
      content_type: ContentType;
      category_type: CategoryType;
      comment_status: CommentStatus;
      contact_status: ContactStatus;
      commercial_status: CommercialStatus;
      payment_status: PaymentStatus;
      delivery_status: DeliveryStatus;
      ad_contract_status: AdContractStatus;
      ad_placement: AdPlacement;
      community_status: CommunityStatus;
      community_role: CommunityRole;
      community_post_status: CommunityPostStatus;
      report_reason: ReportReason;
      report_status: ReportStatus;
      community_category: CommunityCategory;
      profile_visibility: ProfileVisibility;
      interaction_audience: InteractionAudience;
      friendship_status: FriendshipStatus;
      testimonial_status: TestimonialStatus;
      notification_type: NotificationType;
    };
  };
}

// Atalhos convenientes
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
