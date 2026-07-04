// Tipos gerados automaticamente do banco Supabase (projeto uaeanrxnwqodlaltcfks).
// Fonte canônica de referência. O app usa types/database.ts (mantido à mão).
// Regenerar: supabase gen types typescript --project-id <ref> --schema public

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ad_assets: {
        Row: {
          alt: string | null
          contract_id: string
          created_at: string
          height: number | null
          id: string
          image_url: string
          width: number | null
        }
        Insert: {
          alt?: string | null
          contract_id: string
          created_at?: string
          height?: number | null
          id?: string
          image_url: string
          width?: number | null
        }
        Update: {
          alt?: string | null
          contract_id?: string
          created_at?: string
          height?: number | null
          id?: string
          image_url?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_assets_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "active_ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_assets_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "ad_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_clicks: {
        Row: {
          contract_id: string
          created_at: string
          id: string
          placement: Database["public"]["Enums"]["ad_placement"]
          utm: Json | null
        }
        Insert: {
          contract_id: string
          created_at?: string
          id?: string
          placement: Database["public"]["Enums"]["ad_placement"]
          utm?: Json | null
        }
        Update: {
          contract_id?: string
          created_at?: string
          id?: string
          placement?: Database["public"]["Enums"]["ad_placement"]
          utm?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_clicks_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "active_ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_clicks_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "ad_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_contracts: {
        Row: {
          ad_type: string | null
          banner_url: string | null
          client_id: string | null
          company_name: string | null
          contract_type: string | null
          created_at: string
          created_by: string | null
          end_date: string
          id: string
          internal_notes: string | null
          link_url: string | null
          negotiated_value: number | null
          payment_method: string | null
          payment_notes: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          placement: Database["public"]["Enums"]["ad_placement"]
          priority: number
          renewal_enabled: boolean
          start_date: string
          status: Database["public"]["Enums"]["ad_contract_status"]
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          ad_type?: string | null
          banner_url?: string | null
          client_id?: string | null
          company_name?: string | null
          contract_type?: string | null
          created_at?: string
          created_by?: string | null
          end_date: string
          id?: string
          internal_notes?: string | null
          link_url?: string | null
          negotiated_value?: number | null
          payment_method?: string | null
          payment_notes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          placement: Database["public"]["Enums"]["ad_placement"]
          priority?: number
          renewal_enabled?: boolean
          start_date: string
          status?: Database["public"]["Enums"]["ad_contract_status"]
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          ad_type?: string | null
          banner_url?: string | null
          client_id?: string | null
          company_name?: string | null
          contract_type?: string | null
          created_at?: string
          created_by?: string | null
          end_date?: string
          id?: string
          internal_notes?: string | null
          link_url?: string | null
          negotiated_value?: number | null
          payment_method?: string | null
          payment_notes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          placement?: Database["public"]["Enums"]["ad_placement"]
          priority?: number
          renewal_enabled?: boolean
          start_date?: string
          status?: Database["public"]["Enums"]["ad_contract_status"]
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "commercial_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_contracts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_contracts_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_impressions: {
        Row: {
          contract_id: string
          created_at: string
          id: string
          placement: Database["public"]["Enums"]["ad_placement"]
          utm: Json | null
        }
        Insert: {
          contract_id: string
          created_at?: string
          id?: string
          placement: Database["public"]["Enums"]["ad_placement"]
          utm?: Json | null
        }
        Update: {
          contract_id?: string
          created_at?: string
          id?: string
          placement?: Database["public"]["Enums"]["ad_placement"]
          utm?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_impressions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "active_ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_impressions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "ad_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      advertiser_contacts: {
        Row: {
          ad_type: string | null
          budget_range: string | null
          company_name: string | null
          created_at: string
          email: string
          id: string
          message: string | null
          name: string
          segment: string | null
          status: Database["public"]["Enums"]["contact_status"]
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          ad_type?: string | null
          budget_range?: string | null
          company_name?: string | null
          created_at?: string
          email: string
          id?: string
          message?: string | null
          name: string
          segment?: string | null
          status?: Database["public"]["Enums"]["contact_status"]
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          ad_type?: string | null
          budget_range?: string | null
          company_name?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          name?: string
          segment?: string | null
          status?: Database["public"]["Enums"]["contact_status"]
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity: string | null
          entity_id: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          icon_name: string | null
          id: string
          image_url: string | null
          is_fixed_carousel_item: boolean
          name: string
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["account_status"]
          type: Database["public"]["Enums"]["category_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon_name?: string | null
          id?: string
          image_url?: string | null
          is_fixed_carousel_item?: boolean
          name: string
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["account_status"]
          type?: Database["public"]["Enums"]["category_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon_name?: string | null
          id?: string
          image_url?: string | null
          is_fixed_carousel_item?: boolean
          name?: string
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["account_status"]
          type?: Database["public"]["Enums"]["category_type"]
          updated_at?: string
        }
        Relationships: []
      }
      client_history: {
        Row: {
          client_id: string
          content: string | null
          created_at: string
          created_by: string | null
          entry_type: string
          id: string
          title: string | null
        }
        Insert: {
          client_id: string
          content?: string | null
          created_at?: string
          created_by?: string | null
          entry_type?: string
          id?: string
          title?: string | null
        }
        Update: {
          client_id?: string
          content?: string | null
          created_at?: string
          created_by?: string | null
          entry_type?: string
          id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_history_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "commercial_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_history_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          parent_id: string | null
          post_id: string
          status: Database["public"]["Enums"]["comment_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id: string
          status?: Database["public"]["Enums"]["comment_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id?: string
          status?: Database["public"]["Enums"]["comment_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      commercial_clients: {
        Row: {
          client_name: string
          company_name: string | null
          created_at: string
          document: string | null
          email: string | null
          id: string
          notes: string | null
          segment: string | null
          status: Database["public"]["Enums"]["commercial_status"]
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          client_name: string
          company_name?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          notes?: string | null
          segment?: string | null
          status?: Database["public"]["Enums"]["commercial_status"]
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          client_name?: string
          company_name?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          notes?: string | null
          segment?: string | null
          status?: Database["public"]["Enums"]["commercial_status"]
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          status: Database["public"]["Enums"]["contact_status"]
          subject: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          status?: Database["public"]["Enums"]["contact_status"]
          subject?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          status?: Database["public"]["Enums"]["contact_status"]
          subject?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      contract_history: {
        Row: {
          action: string
          contract_id: string
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
        }
        Insert: {
          action: string
          contract_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
        }
        Update: {
          action?: string
          contract_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_history_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "active_ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_history_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "ad_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_history_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          confirmed: boolean
          created_at: string
          email: string
          id: string
          name: string | null
          unsubscribed: boolean
        }
        Insert: {
          confirmed?: boolean
          created_at?: string
          email: string
          id?: string
          name?: string | null
          unsubscribed?: boolean
        }
        Update: {
          confirmed?: boolean
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          unsubscribed?: boolean
        }
        Relationships: []
      }
      page_views: {
        Row: {
          created_at: string
          id: string
          path: string
          referrer: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          path: string
          referrer?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          path?: string
          referrer?: string | null
        }
        Relationships: []
      }
      post_gallery: {
        Row: {
          alt: string | null
          created_at: string
          id: string
          post_id: string
          sort_order: number
          url: string
        }
        Insert: {
          alt?: string | null
          created_at?: string
          id?: string
          post_id: string
          sort_order?: number
          url: string
        }
        Update: {
          alt?: string | null
          created_at?: string
          id?: string
          post_id?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_gallery_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_images: {
        Row: {
          alt: string | null
          created_at: string
          id: string
          post_id: string
          url: string
        }
        Insert: {
          alt?: string | null
          created_at?: string
          id?: string
          post_id: string
          url: string
        }
        Update: {
          alt?: string | null
          created_at?: string
          id?: string
          post_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_images_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_tags: {
        Row: {
          post_id: string
          tag_id: string
        }
        Insert: {
          post_id: string
          tag_id: string
        }
        Update: {
          post_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      post_views: {
        Row: {
          created_at: string
          id: string
          post_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_views_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          allow_indexing: boolean
          author_id: string
          category_id: string | null
          content_html: string | null
          content_json: Json | null
          content_type: Database["public"]["Enums"]["content_type"]
          cover_image_alt: string | null
          cover_image_url: string | null
          created_at: string
          editorial_notes: string | null
          event_address: string | null
          event_end_date: string | null
          event_location: string | null
          event_map_url: string | null
          event_organizer: string | null
          event_start_date: string | null
          event_ticket_url: string | null
          excerpt: string | null
          focus_keyword: string | null
          id: string
          include_in_rss: boolean
          include_in_sitemap: boolean
          is_event: boolean
          is_featured: boolean
          is_sponsored: boolean
          local_seo_keyword: string | null
          moderation_status: Database["public"]["Enums"]["moderation_status"]
          published_at: string | null
          rating_avg: number
          rating_count: number
          reviewed_by: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          social_description: string | null
          social_image_url: string | null
          social_title: string | null
          source_note: string | null
          status: Database["public"]["Enums"]["post_status"]
          subtitle: string | null
          title: string
          updated_at: string
          views_count: number
        }
        Insert: {
          allow_indexing?: boolean
          author_id: string
          category_id?: string | null
          content_html?: string | null
          content_json?: Json | null
          content_type?: Database["public"]["Enums"]["content_type"]
          cover_image_alt?: string | null
          cover_image_url?: string | null
          created_at?: string
          editorial_notes?: string | null
          event_address?: string | null
          event_end_date?: string | null
          event_location?: string | null
          event_map_url?: string | null
          event_organizer?: string | null
          event_start_date?: string | null
          event_ticket_url?: string | null
          excerpt?: string | null
          focus_keyword?: string | null
          id?: string
          include_in_rss?: boolean
          include_in_sitemap?: boolean
          is_event?: boolean
          is_featured?: boolean
          is_sponsored?: boolean
          local_seo_keyword?: string | null
          moderation_status?: Database["public"]["Enums"]["moderation_status"]
          published_at?: string | null
          rating_avg?: number
          rating_count?: number
          reviewed_by?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          social_description?: string | null
          social_image_url?: string | null
          social_title?: string | null
          source_note?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          subtitle?: string | null
          title: string
          updated_at?: string
          views_count?: number
        }
        Update: {
          allow_indexing?: boolean
          author_id?: string
          category_id?: string | null
          content_html?: string | null
          content_json?: Json | null
          content_type?: Database["public"]["Enums"]["content_type"]
          cover_image_alt?: string | null
          cover_image_url?: string | null
          created_at?: string
          editorial_notes?: string | null
          event_address?: string | null
          event_end_date?: string | null
          event_location?: string | null
          event_map_url?: string | null
          event_organizer?: string | null
          event_start_date?: string | null
          event_ticket_url?: string | null
          excerpt?: string | null
          focus_keyword?: string | null
          id?: string
          include_in_rss?: boolean
          include_in_sitemap?: boolean
          is_event?: boolean
          is_featured?: boolean
          is_sponsored?: boolean
          local_seo_keyword?: string | null
          moderation_status?: Database["public"]["Enums"]["moderation_status"]
          published_at?: string | null
          rating_avg?: number
          rating_count?: number
          reviewed_by?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          social_description?: string | null
          social_image_url?: string | null
          social_title?: string | null
          source_note?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          subtitle?: string | null
          title?: string
          updated_at?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          slug: string | null
          status: Database["public"]["Enums"]["account_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          slug?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          slug?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ratings: {
        Row: {
          created_at: string
          id: string
          post_id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      related_posts: {
        Row: {
          post_id: string
          related_post_id: string
          sort_order: number
        }
        Insert: {
          post_id: string
          related_post_id: string
          sort_order?: number
        }
        Update: {
          post_id?: string
          related_post_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "related_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "related_posts_related_post_id_fkey"
            columns: ["related_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      sponsored_articles: {
        Row: {
          client_id: string | null
          contract_id: string | null
          created_at: string
          end_date: string | null
          id: string
          is_active: boolean
          label: string
          post_id: string
          start_date: string | null
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          contract_id?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          label?: string
          post_id: string
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          contract_id?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          label?: string
          post_id?: string
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsored_articles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "commercial_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsored_articles_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "active_ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsored_articles_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "ad_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsored_articles_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsored_events: {
        Row: {
          client_id: string | null
          contract_id: string | null
          created_at: string
          end_date: string | null
          id: string
          is_active: boolean
          label: string
          post_id: string
          start_date: string | null
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          contract_id?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          label?: string
          post_id: string
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          contract_id?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          label?: string
          post_id?: string
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsored_events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "commercial_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsored_events_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "active_ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsored_events_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "ad_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsored_events_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      standalone_products: {
        Row: {
          client_id: string | null
          company_name: string | null
          created_at: string
          delivery_status: Database["public"]["Enums"]["delivery_status"]
          description: string | null
          id: string
          notes: string | null
          payment_method: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          price: number | null
          product_name: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          company_name?: string | null
          created_at?: string
          delivery_status?: Database["public"]["Enums"]["delivery_status"]
          description?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          price?: number | null
          product_name: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          company_name?: string | null
          created_at?: string
          delivery_status?: Database["public"]["Enums"]["delivery_status"]
          description?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          price?: number | null
          product_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "standalone_products_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "commercial_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      active_ads: {
        Row: {
          banner_url: string | null
          company_name: string | null
          end_date: string | null
          id: string | null
          link_url: string | null
          placement: Database["public"]["Enums"]["ad_placement"] | null
          priority: number | null
          start_date: string | null
          title: string | null
        }
        Insert: {
          banner_url?: string | null
          company_name?: string | null
          end_date?: string | null
          id?: string | null
          link_url?: string | null
          placement?: Database["public"]["Enums"]["ad_placement"] | null
          priority?: number | null
          start_date?: string | null
          title?: string | null
        }
        Update: {
          banner_url?: string | null
          company_name?: string | null
          end_date?: string | null
          id?: string | null
          link_url?: string | null
          placement?: Database["public"]["Enums"]["ad_placement"] | null
          priority?: number | null
          start_date?: string | null
          title?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_metrics: { Args: never; Returns: Json }
      admin_metrics_guarded: { Args: never; Returns: Json }
      current_role_name: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      expire_contracts: { Args: never; Returns: number }
      get_active_ads: {
        Args: { p_placement: Database["public"]["Enums"]["ad_placement"] }
        Returns: {
          banner_url: string
          company_name: string
          id: string
          link_url: string
          placement: Database["public"]["Enums"]["ad_placement"]
          priority: number
          title: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      is_publisher_or_admin: { Args: never; Returns: boolean }
      promote_to_admin: { Args: { p_email: string }; Returns: undefined }
      register_post_view: { Args: { p_post_id: string }; Returns: undefined }
    }
    Enums: {
      account_status: "active" | "suspended" | "pending"
      ad_contract_status:
        | "rascunho"
        | "agendado"
        | "ativo"
        | "pausado"
        | "expirado"
        | "removido"
        | "cancelado"
      ad_placement:
        | "home_top"
        | "home_middle"
        | "home_carousel"
        | "post_sidebar"
        | "post_inline_mobile"
        | "category_top"
        | "event_sidebar"
        | "fixed_carousel_sponsor"
      category_type: "editorial" | "guia" | "institucional"
      comment_status: "pendente" | "aprovado" | "rejeitado" | "removido"
      commercial_status: "ativo" | "inativo" | "prospecto"
      contact_status:
        | "novo"
        | "lido"
        | "em_atendimento"
        | "concluido"
        | "arquivado"
      content_type:
        | "noticia"
        | "evento"
        | "guia"
        | "publieditorial"
        | "conteudo_patrocinado"
        | "comunidade"
        | "turismo"
        | "religiosidade"
      delivery_status: "pendente" | "em_producao" | "entregue" | "cancelado"
      moderation_status: "pendente" | "aprovado" | "rejeitado"
      payment_status: "pendente" | "parcial" | "pago" | "atrasado" | "cancelado"
      post_status:
        | "rascunho"
        | "enviado_para_revisao"
        | "publicado"
        | "arquivado"
        | "removido"
      user_role: "common_user" | "publisher" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_status: ["active", "suspended", "pending"],
      ad_contract_status: [
        "rascunho",
        "agendado",
        "ativo",
        "pausado",
        "expirado",
        "removido",
        "cancelado",
      ],
      ad_placement: [
        "home_top",
        "home_middle",
        "home_carousel",
        "post_sidebar",
        "post_inline_mobile",
        "category_top",
        "event_sidebar",
        "fixed_carousel_sponsor",
      ],
      category_type: ["editorial", "guia", "institucional"],
      comment_status: ["pendente", "aprovado", "rejeitado", "removido"],
      commercial_status: ["ativo", "inativo", "prospecto"],
      contact_status: [
        "novo",
        "lido",
        "em_atendimento",
        "concluido",
        "arquivado",
      ],
      content_type: [
        "noticia",
        "evento",
        "guia",
        "publieditorial",
        "conteudo_patrocinado",
        "comunidade",
        "turismo",
        "religiosidade",
      ],
      delivery_status: ["pendente", "em_producao", "entregue", "cancelado"],
      moderation_status: ["pendente", "aprovado", "rejeitado"],
      payment_status: ["pendente", "parcial", "pago", "atrasado", "cancelado"],
      post_status: [
        "rascunho",
        "enviado_para_revisao",
        "publicado",
        "arquivado",
        "removido",
      ],
      user_role: ["common_user", "publisher", "admin"],
    },
  },
} as const

