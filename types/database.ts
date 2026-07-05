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
export type AccountStatus = 'active' | 'suspended' | 'pending';
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
export type PaymentStatus = 'pendente' | 'parcial' | 'pago' | 'atrasado' | 'cancelado';
export type DeliveryStatus = 'pendente' | 'em_producao' | 'entregue' | 'cancelado';
export type AdContractStatus =
  | 'rascunho'
  | 'agendado'
  | 'ativo'
  | 'pausado'
  | 'expirado'
  | 'removido'
  | 'cancelado';
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
          placement: AdPlacement;
          banner_url: string | null;
          link_url: string | null;
          status: AdContractStatus;
          priority: number;
          renewal_enabled: boolean;
          created_by: string | null;
          updated_by: string | null;
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
          placement: AdPlacement;
          banner_url?: string | null;
          link_url?: string | null;
          status?: AdContractStatus;
          priority?: number;
          renewal_enabled?: boolean;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['ad_contracts']['Insert']>;
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
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          contract_id: string;
          action: string;
          notes?: string | null;
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
          placement: AdPlacement;
          utm: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          contract_id: string;
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
          placement: AdPlacement;
          utm: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          contract_id: string;
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
        } & WithTimestamps;
        Insert: {
          id?: string;
          profile_id: string;
          title: string;
          cover_url?: string | null;
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
      admin_metrics_guarded: { Args: Record<string, never>; Returns: Json };
      expire_contracts: { Args: Record<string, never>; Returns: number };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      is_publisher_or_admin: { Args: Record<string, never>; Returns: boolean };
      is_community_member: { Args: { cid: string }; Returns: boolean };
      is_community_owner: { Args: { cid: string }; Returns: boolean };
      is_community_moderator: { Args: { cid: string }; Returns: boolean };
      current_profile_id: { Args: Record<string, never>; Returns: string };
      are_friends: { Args: { a: string; b: string }; Returns: boolean };
      can_view_profile: { Args: { target: string }; Returns: boolean };
      is_blocked: { Args: { a: string; b: string }; Returns: boolean };
      is_conversation_participant: { Args: { cid: string }; Returns: boolean };
      push_notification: {
        Args: { p_recipient: string; p_type: NotificationType; p_entity: string | null };
        Returns: undefined;
      };
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
