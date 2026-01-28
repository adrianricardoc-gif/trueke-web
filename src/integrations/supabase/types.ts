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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          icon: string
          id: string
          is_active: boolean | null
          is_secret: boolean | null
          name: string
          requirement_type: string
          requirement_value: number
          reward_badge_id: string | null
          reward_trukoins: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          icon: string
          id?: string
          is_active?: boolean | null
          is_secret?: boolean | null
          name: string
          requirement_type: string
          requirement_value: number
          reward_badge_id?: string | null
          reward_trukoins?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean | null
          is_secret?: boolean | null
          name?: string
          requirement_type?: string
          requirement_value?: number
          reward_badge_id?: string | null
          reward_trukoins?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "achievements_reward_badge_id_fkey"
            columns: ["reward_badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_secret: boolean | null
          key: string
          updated_at: string | null
          value: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_secret?: boolean | null
          key: string
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_secret?: boolean | null
          key?: string
          updated_at?: string | null
          value?: string | null
        }
        Relationships: []
      }
      auction_bids: {
        Row: {
          amount: number
          auction_id: string | null
          bidder_id: string
          created_at: string | null
          id: string
          is_winning: boolean | null
        }
        Insert: {
          amount: number
          auction_id?: string | null
          bidder_id: string
          created_at?: string | null
          id?: string
          is_winning?: boolean | null
        }
        Update: {
          amount?: number
          auction_id?: string | null
          bidder_id?: string
          created_at?: string | null
          id?: string
          is_winning?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "auction_bids_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "auctions"
            referencedColumns: ["id"]
          },
        ]
      }
      auctions: {
        Row: {
          created_at: string | null
          current_price: number | null
          ends_at: string
          id: string
          min_increment: number | null
          product_id: string | null
          seller_id: string
          starting_price: number | null
          status: string | null
          updated_at: string | null
          winner_id: string | null
        }
        Insert: {
          created_at?: string | null
          current_price?: number | null
          ends_at: string
          id?: string
          min_increment?: number | null
          product_id?: string | null
          seller_id: string
          starting_price?: number | null
          status?: string | null
          updated_at?: string | null
          winner_id?: string | null
        }
        Update: {
          created_at?: string | null
          current_price?: number | null
          ends_at?: string
          id?: string
          min_increment?: number | null
          product_id?: string | null
          seller_id?: string
          starting_price?: number | null
          status?: string | null
          updated_at?: string | null
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auctions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "hot_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auctions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      auto_republish_settings: {
        Row: {
          created_at: string | null
          current_republish_count: number | null
          id: string
          is_enabled: boolean | null
          last_republished_at: string | null
          max_republishes: number | null
          next_republish_at: string | null
          product_id: string | null
          republish_interval_days: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_republish_count?: number | null
          id?: string
          is_enabled?: boolean | null
          last_republished_at?: string | null
          max_republishes?: number | null
          next_republish_at?: string | null
          product_id?: string | null
          republish_interval_days?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_republish_count?: number | null
          id?: string
          is_enabled?: boolean | null
          last_republished_at?: string | null
          max_republishes?: number | null
          next_republish_at?: string | null
          product_id?: string | null
          republish_interval_days?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auto_republish_settings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "hot_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auto_republish_settings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          name: string
          requirement_type: string
          requirement_value: number
        }
        Insert: {
          created_at?: string
          description: string
          icon: string
          id?: string
          name: string
          requirement_type: string
          requirement_value: number
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          requirement_type?: string
          requirement_value?: number
        }
        Relationships: []
      }
      circular_trade_participants: {
        Row: {
          confirmed_at: string | null
          created_at: string | null
          gives_to_user_id: string | null
          id: string
          position: number | null
          product_id: string | null
          receives_from_user_id: string | null
          status: string | null
          trade_id: string | null
          user_id: string
        }
        Insert: {
          confirmed_at?: string | null
          created_at?: string | null
          gives_to_user_id?: string | null
          id?: string
          position?: number | null
          product_id?: string | null
          receives_from_user_id?: string | null
          status?: string | null
          trade_id?: string | null
          user_id: string
        }
        Update: {
          confirmed_at?: string | null
          created_at?: string | null
          gives_to_user_id?: string | null
          id?: string
          position?: number | null
          product_id?: string | null
          receives_from_user_id?: string | null
          status?: string | null
          trade_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "circular_trade_participants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "hot_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "circular_trade_participants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "circular_trade_participants_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "circular_trades"
            referencedColumns: ["id"]
          },
        ]
      }
      circular_trades: {
        Row: {
          completed_at: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          initiator_id: string
          max_participants: number | null
          min_participants: number | null
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          initiator_id: string
          max_participants?: number | null
          min_participants?: number | null
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          initiator_id?: string
          max_participants?: number | null
          min_participants?: number | null
          status?: string | null
        }
        Relationships: []
      }
      company_analytics: {
        Row: {
          conversions_count: number
          created_at: string
          id: string
          inquiries_count: number
          likes_count: number
          period_end: string
          period_start: string
          response_rate: number | null
          user_id: string
          views_count: number
        }
        Insert: {
          conversions_count?: number
          created_at?: string
          id?: string
          inquiries_count?: number
          likes_count?: number
          period_end: string
          period_start: string
          response_rate?: number | null
          user_id: string
          views_count?: number
        }
        Update: {
          conversions_count?: number
          created_at?: string
          id?: string
          inquiries_count?: number
          likes_count?: number
          period_end?: string
          period_start?: string
          response_rate?: number | null
          user_id?: string
          views_count?: number
        }
        Relationships: []
      }
      discount_code_uses: {
        Row: {
          code_id: string
          discount_applied: number
          id: string
          subscription_id: string | null
          used_at: string
          user_id: string
        }
        Insert: {
          code_id: string
          discount_applied: number
          id?: string
          subscription_id?: string | null
          used_at?: string
          user_id: string
        }
        Update: {
          code_id?: string
          discount_applied?: number
          id?: string
          subscription_id?: string | null
          used_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discount_code_uses_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_code_uses_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_codes: {
        Row: {
          applicable_plans: string[] | null
          code: string
          created_at: string
          created_by: string | null
          current_uses: number
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean
          max_uses: number | null
          min_plan_price: number | null
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          applicable_plans?: string[] | null
          code: string
          created_at?: string
          created_by?: string | null
          current_uses?: number
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_plan_price?: number | null
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          applicable_plans?: string[] | null
          code?: string
          created_at?: string
          created_by?: string | null
          current_uses?: number
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_plan_price?: number | null
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "hot_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          feature_key: string
          feature_name: string
          id: string
          is_enabled: boolean | null
          requires_api_key: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          feature_key: string
          feature_name: string
          id?: string
          is_enabled?: boolean | null
          requires_api_key?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          feature_key?: string
          feature_name?: string
          id?: string
          is_enabled?: boolean | null
          requires_api_key?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      featured_products: {
        Row: {
          created_at: string
          featured_until: string | null
          id: string
          priority: number
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          featured_until?: string | null
          id?: string
          priority?: number
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          featured_until?: string | null
          id?: string
          priority?: number
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "featured_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "hot_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "featured_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string | null
          id: string
          joined_at: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          group_id?: string | null
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          group_id?: string | null
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "thematic_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      market_analytics: {
        Row: {
          avg_price: number | null
          category: string
          city: string | null
          created_at: string | null
          demand_score: number | null
          id: string
          max_price: number | null
          min_price: number | null
          period_end: string
          period_start: string
          total_listings: number | null
          total_trades: number | null
          trend: string | null
        }
        Insert: {
          avg_price?: number | null
          category: string
          city?: string | null
          created_at?: string | null
          demand_score?: number | null
          id?: string
          max_price?: number | null
          min_price?: number | null
          period_end: string
          period_start: string
          total_listings?: number | null
          total_trades?: number | null
          trend?: string | null
        }
        Update: {
          avg_price?: number | null
          category?: string
          city?: string | null
          created_at?: string | null
          demand_score?: number | null
          id?: string
          max_price?: number | null
          min_price?: number | null
          period_end?: string
          period_start?: string
          total_listings?: number | null
          total_trades?: number | null
          trend?: string | null
        }
        Relationships: []
      }
      matches: {
        Row: {
          created_at: string
          id: string
          product1_id: string
          product2_id: string
          status: string
          updated_at: string
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product1_id: string
          product2_id: string
          status?: string
          updated_at?: string
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product1_id?: string
          product2_id?: string
          status?: string
          updated_at?: string
          user1_id?: string
          user2_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_product1_id_fkey"
            columns: ["product1_id"]
            isOneToOne: false
            referencedRelation: "hot_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_product1_id_fkey"
            columns: ["product1_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_product2_id_fkey"
            columns: ["product2_id"]
            isOneToOne: false
            referencedRelation: "hot_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_product2_id_fkey"
            columns: ["product2_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_appointments: {
        Row: {
          confirmed_at: string | null
          created_at: string | null
          id: string
          match_id: string | null
          meeting_point_id: string | null
          notes: string | null
          proposed_by: string
          proposed_date: string
          status: string | null
        }
        Insert: {
          confirmed_at?: string | null
          created_at?: string | null
          id?: string
          match_id?: string | null
          meeting_point_id?: string | null
          notes?: string | null
          proposed_by: string
          proposed_date: string
          status?: string | null
        }
        Update: {
          confirmed_at?: string | null
          created_at?: string | null
          id?: string
          match_id?: string | null
          meeting_point_id?: string | null
          notes?: string | null
          proposed_by?: string
          proposed_date?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_appointments_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_appointments_meeting_point_id_fkey"
            columns: ["meeting_point_id"]
            isOneToOne: false
            referencedRelation: "safe_meeting_points"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          match_id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          match_id: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          match_id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      missions: {
        Row: {
          action_type: string
          created_at: string | null
          description: string | null
          ends_at: string | null
          id: string
          is_active: boolean | null
          mission_type: string
          reward_trukoins: number
          reward_xp: number | null
          starts_at: string | null
          target_count: number
          title: string
        }
        Insert: {
          action_type: string
          created_at?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          mission_type?: string
          reward_trukoins?: number
          reward_xp?: number | null
          starts_at?: string | null
          target_count?: number
          title: string
        }
        Update: {
          action_type?: string
          created_at?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          mission_type?: string
          reward_trukoins?: number
          reward_xp?: number | null
          starts_at?: string | null
          target_count?: number
          title?: string
        }
        Relationships: []
      }
      monthly_rankings: {
        Row: {
          created_at: string | null
          id: string
          month: number
          rank_position: number | null
          rating_avg: number | null
          trades_count: number | null
          trukoins_earned: number | null
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          month: number
          rank_position?: number | null
          rating_avg?: number | null
          trades_count?: number | null
          trukoins_earned?: number | null
          user_id: string
          year: number
        }
        Update: {
          created_at?: string | null
          id?: string
          month?: number
          rank_position?: number | null
          rating_avg?: number | null
          trades_count?: number | null
          trukoins_earned?: number | null
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          email_enabled: boolean | null
          id: string
          mission_reminders: boolean | null
          new_in_categories: boolean | null
          price_drops: boolean | null
          push_enabled: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          streak_reminders: boolean | null
          tournament_updates: boolean | null
          trade_reminders: boolean | null
          updated_at: string | null
          user_id: string
          weekly_digest: boolean | null
          wishlist_matches: boolean | null
        }
        Insert: {
          created_at?: string | null
          email_enabled?: boolean | null
          id?: string
          mission_reminders?: boolean | null
          new_in_categories?: boolean | null
          price_drops?: boolean | null
          push_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          streak_reminders?: boolean | null
          tournament_updates?: boolean | null
          trade_reminders?: boolean | null
          updated_at?: string | null
          user_id: string
          weekly_digest?: boolean | null
          wishlist_matches?: boolean | null
        }
        Update: {
          created_at?: string | null
          email_enabled?: boolean | null
          id?: string
          mission_reminders?: boolean | null
          new_in_categories?: boolean | null
          price_drops?: boolean | null
          push_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          streak_reminders?: boolean | null
          tournament_updates?: boolean | null
          trade_reminders?: boolean | null
          updated_at?: string | null
          user_id?: string
          weekly_digest?: boolean | null
          wishlist_matches?: boolean | null
        }
        Relationships: []
      }
      partial_trade_offers: {
        Row: {
          created_at: string | null
          id: string
          match_id: string | null
          message: string | null
          percentage_product: number | null
          product_id: string | null
          receiver_id: string
          responded_at: string | null
          sender_id: string
          status: string | null
          trukoin_amount: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          match_id?: string | null
          message?: string | null
          percentage_product?: number | null
          product_id?: string | null
          receiver_id: string
          responded_at?: string | null
          sender_id: string
          status?: string | null
          trukoin_amount?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          match_id?: string | null
          message?: string | null
          percentage_product?: number | null
          product_id?: string | null
          receiver_id?: string
          responded_at?: string | null
          sender_id?: string
          status?: string | null
          trukoin_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "partial_trade_offers_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partial_trade_offers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "hot_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partial_trade_offers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      premium_plans: {
        Row: {
          billing_period: string
          boosts_per_month: number | null
          can_see_likes: boolean | null
          created_at: string
          description: string | null
          enable_achievements: boolean | null
          enable_auctions: boolean | null
          enable_boosts: boolean | null
          enable_hot_priority: boolean | null
          enable_missions: boolean | null
          enable_rewinds: boolean | null
          enable_super_likes: boolean | null
          enable_tournaments: boolean | null
          enable_who_likes_me: boolean | null
          features: Json
          id: string
          is_active: boolean
          max_featured_products: number | null
          max_products: number | null
          name: string
          price: number
          priority_in_hot: boolean | null
          rewinds_per_day: number | null
          super_likes_per_day: number | null
          target_user_type: string
          updated_at: string
          visibility_boost: number
        }
        Insert: {
          billing_period?: string
          boosts_per_month?: number | null
          can_see_likes?: boolean | null
          created_at?: string
          description?: string | null
          enable_achievements?: boolean | null
          enable_auctions?: boolean | null
          enable_boosts?: boolean | null
          enable_hot_priority?: boolean | null
          enable_missions?: boolean | null
          enable_rewinds?: boolean | null
          enable_super_likes?: boolean | null
          enable_tournaments?: boolean | null
          enable_who_likes_me?: boolean | null
          features?: Json
          id?: string
          is_active?: boolean
          max_featured_products?: number | null
          max_products?: number | null
          name: string
          price?: number
          priority_in_hot?: boolean | null
          rewinds_per_day?: number | null
          super_likes_per_day?: number | null
          target_user_type?: string
          updated_at?: string
          visibility_boost?: number
        }
        Update: {
          billing_period?: string
          boosts_per_month?: number | null
          can_see_likes?: boolean | null
          created_at?: string
          description?: string | null
          enable_achievements?: boolean | null
          enable_auctions?: boolean | null
          enable_boosts?: boolean | null
          enable_hot_priority?: boolean | null
          enable_missions?: boolean | null
          enable_rewinds?: boolean | null
          enable_super_likes?: boolean | null
          enable_tournaments?: boolean | null
          enable_who_likes_me?: boolean | null
          features?: Json
          id?: string
          is_active?: boolean
          max_featured_products?: number | null
          max_products?: number | null
          name?: string
          price?: number
          priority_in_hot?: boolean | null
          rewinds_per_day?: number | null
          super_likes_per_day?: number | null
          target_user_type?: string
          updated_at?: string
          visibility_boost?: number
        }
        Relationships: []
      }
      premium_usage: {
        Row: {
          count: number
          id: string
          usage_date: string
          usage_type: string
          user_id: string
        }
        Insert: {
          count?: number
          id?: string
          usage_date?: string
          usage_type: string
          user_id: string
        }
        Update: {
          count?: number
          id?: string
          usage_date?: string
          usage_type?: string
          user_id?: string
        }
        Relationships: []
      }
      price_history: {
        Row: {
          additional_value: number | null
          changed_at: string
          changed_by: string
          estimated_value: number
          id: string
          product_id: string
        }
        Insert: {
          additional_value?: number | null
          changed_at?: string
          changed_by: string
          estimated_value: number
          id?: string
          product_id: string
        }
        Update: {
          additional_value?: number | null
          changed_at?: string
          changed_by?: string
          estimated_value?: number
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "hot_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_boosts: {
        Row: {
          boost_type: string | null
          created_at: string | null
          ends_at: string
          id: string
          impressions: number | null
          product_id: string | null
          starts_at: string | null
          trukoins_spent: number
          user_id: string
        }
        Insert: {
          boost_type?: string | null
          created_at?: string | null
          ends_at: string
          id?: string
          impressions?: number | null
          product_id?: string | null
          starts_at?: string | null
          trukoins_spent: number
          user_id: string
        }
        Update: {
          boost_type?: string | null
          created_at?: string | null
          ends_at?: string
          id?: string
          impressions?: number | null
          product_id?: string | null
          starts_at?: string | null
          trukoins_spent?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_boosts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "hot_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_boosts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_ownership_history: {
        Row: {
          acquired_from_user_id: string | null
          acquired_via: string | null
          created_at: string | null
          id: string
          match_id: string | null
          owned_from: string | null
          owned_until: string | null
          owner_id: string
          product_id: string | null
        }
        Insert: {
          acquired_from_user_id?: string | null
          acquired_via?: string | null
          created_at?: string | null
          id?: string
          match_id?: string | null
          owned_from?: string | null
          owned_until?: string | null
          owner_id: string
          product_id?: string | null
        }
        Update: {
          acquired_from_user_id?: string | null
          acquired_via?: string | null
          created_at?: string | null
          id?: string
          match_id?: string | null
          owned_from?: string | null
          owned_until?: string | null
          owner_id?: string
          product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_ownership_history_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_ownership_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "hot_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_ownership_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_verifications: {
        Row: {
          analysis_result: Json | null
          created_at: string | null
          id: string
          is_authentic: boolean | null
          product_id: string | null
          verification_score: number | null
          verified_at: string | null
        }
        Insert: {
          analysis_result?: Json | null
          created_at?: string | null
          id?: string
          is_authentic?: boolean | null
          product_id?: string | null
          verification_score?: number | null
          verified_at?: string | null
        }
        Update: {
          analysis_result?: Json | null
          created_at?: string | null
          id?: string
          is_authentic?: boolean | null
          product_id?: string | null
          verification_score?: number | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_verifications_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "hot_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_verifications_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          additional_value: number | null
          category: string
          condition: string | null
          created_at: string
          description: string | null
          estimated_value: number
          expires_at: string | null
          expiry_notified_1day: boolean | null
          expiry_notified_3days: boolean | null
          id: string
          images: string[]
          latitude: number | null
          location: string | null
          longitude: number | null
          product_type: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          additional_value?: number | null
          category: string
          condition?: string | null
          created_at?: string
          description?: string | null
          estimated_value?: number
          expires_at?: string | null
          expiry_notified_1day?: boolean | null
          expiry_notified_3days?: boolean | null
          id?: string
          images?: string[]
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          product_type?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          additional_value?: number | null
          category?: string
          condition?: string | null
          created_at?: string
          description?: string | null
          estimated_value?: number
          expires_at?: string | null
          expiry_notified_1day?: boolean | null
          expiry_notified_3days?: boolean | null
          id?: string
          images?: string[]
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          product_type?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          is_verified: boolean
          latitude: number | null
          location: string | null
          location_verified_at: string | null
          longitude: number | null
          theme_preference: string | null
          updated_at: string
          user_id: string
          user_type: string
          verified_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_verified?: boolean
          latitude?: number | null
          location?: string | null
          location_verified_at?: string | null
          longitude?: number | null
          theme_preference?: string | null
          updated_at?: string
          user_id: string
          user_type?: string
          verified_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_verified?: boolean
          latitude?: number | null
          location?: string | null
          location_verified_at?: string | null
          longitude?: number | null
          theme_preference?: string | null
          updated_at?: string
          user_id?: string
          user_type?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          reward_trukoins: number | null
          user_id: string
          uses_count: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          reward_trukoins?: number | null
          user_id: string
          uses_count?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          reward_trukoins?: number | null
          user_id?: string
          uses_count?: number | null
        }
        Relationships: []
      }
      referral_uses: {
        Row: {
          code_id: string | null
          created_at: string | null
          id: string
          referred_user_id: string
          referrer_user_id: string
          trukoins_earned: number | null
        }
        Insert: {
          code_id?: string | null
          created_at?: string | null
          id?: string
          referred_user_id: string
          referrer_user_id: string
          trukoins_earned?: number | null
        }
        Update: {
          code_id?: string | null
          created_at?: string | null
          id?: string
          referred_user_id?: string
          referrer_user_id?: string
          trukoins_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_uses_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          reason: string
          report_type: string
          reported_product_id: string | null
          reported_user_id: string | null
          reporter_id: string
          status: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          report_type: string
          reported_product_id?: string | null
          reported_user_id?: string | null
          reporter_id: string
          status?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          report_type?: string
          reported_product_id?: string | null
          reported_user_id?: string | null
          reporter_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_reported_product_id_fkey"
            columns: ["reported_product_id"]
            isOneToOne: false
            referencedRelation: "hot_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reported_product_id_fkey"
            columns: ["reported_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      review_photos: {
        Row: {
          caption: string | null
          created_at: string | null
          id: string
          photo_url: string
          review_id: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          id?: string
          photo_url: string
          review_id?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          id?: string
          photo_url?: string
          review_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_photos_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          match_id: string
          rating: number
          reviewed_id: string
          reviewer_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          match_id: string
          rating: number
          reviewed_id: string
          reviewer_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          match_id?: string
          rating?: number
          reviewed_id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      safe_meeting_points: {
        Row: {
          address: string
          city: string
          created_at: string | null
          id: string
          is_verified: boolean | null
          latitude: number
          longitude: number
          name: string
          operating_hours: Json | null
          place_type: string | null
          rating: number | null
          reviews_count: number | null
        }
        Insert: {
          address: string
          city: string
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          latitude: number
          longitude: number
          name: string
          operating_hours?: Json | null
          place_type?: string | null
          rating?: number | null
          reviews_count?: number | null
        }
        Update: {
          address?: string
          city?: string
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          latitude?: number
          longitude?: number
          name?: string
          operating_hours?: Json | null
          place_type?: string | null
          rating?: number | null
          reviews_count?: number | null
        }
        Relationships: []
      }
      scheduled_trades: {
        Row: {
          created_at: string | null
          id: string
          location: string | null
          match_id: string | null
          meeting_point_id: string | null
          notes: string | null
          proposed_by: string
          reminder_sent: boolean | null
          scheduled_date: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          location?: string | null
          match_id?: string | null
          meeting_point_id?: string | null
          notes?: string | null
          proposed_by: string
          reminder_sent?: boolean | null
          scheduled_date: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          location?: string | null
          match_id?: string | null
          meeting_point_id?: string | null
          notes?: string | null
          proposed_by?: string
          reminder_sent?: boolean | null
          scheduled_date?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_trades_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_trades_meeting_point_id_fkey"
            columns: ["meeting_point_id"]
            isOneToOne: false
            referencedRelation: "safe_meeting_points"
            referencedColumns: ["id"]
          },
        ]
      }
      super_likes: {
        Row: {
          created_at: string
          id: string
          product_id: string | null
          receiver_id: string
          seen_at: string | null
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id?: string | null
          receiver_id: string
          seen_at?: string | null
          sender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string | null
          receiver_id?: string
          seen_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "super_likes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "hot_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "super_likes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      swipes: {
        Row: {
          action: string
          created_at: string
          id: string
          is_super_like: boolean | null
          offered_product_id: string | null
          product_id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          is_super_like?: boolean | null
          offered_product_id?: string | null
          product_id: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          is_super_like?: boolean | null
          offered_product_id?: string | null
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "swipes_offered_product_id_fkey"
            columns: ["offered_product_id"]
            isOneToOne: false
            referencedRelation: "hot_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "swipes_offered_product_id_fkey"
            columns: ["offered_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "swipes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "hot_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "swipes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      thematic_groups: {
        Row: {
          category: string
          created_at: string | null
          creator_id: string
          description: string | null
          id: string
          image_url: string | null
          is_public: boolean | null
          member_count: number | null
          name: string
        }
        Insert: {
          category: string
          created_at?: string | null
          creator_id: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_public?: boolean | null
          member_count?: number | null
          name: string
        }
        Update: {
          category?: string
          created_at?: string | null
          creator_id?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_public?: boolean | null
          member_count?: number | null
          name?: string
        }
        Relationships: []
      }
      tournament_participants: {
        Row: {
          id: string
          joined_at: string | null
          rank_position: number | null
          score: number | null
          tournament_id: string | null
          trades_count: number | null
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          rank_position?: number | null
          score?: number | null
          tournament_id?: string | null
          trades_count?: number | null
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          rank_position?: number | null
          score?: number | null
          tournament_id?: string | null
          trades_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_participants_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          end_date: string
          id: string
          max_participants: number | null
          min_participants: number | null
          name: string
          prize_description: string | null
          prize_trukoins: number | null
          start_date: string
          status: string | null
          tournament_type: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          end_date: string
          id?: string
          max_participants?: number | null
          min_participants?: number | null
          name: string
          prize_description?: string | null
          prize_trukoins?: number | null
          start_date: string
          status?: string | null
          tournament_type?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string
          id?: string
          max_participants?: number | null
          min_participants?: number | null
          name?: string
          prize_description?: string | null
          prize_trukoins?: number | null
          start_date?: string
          status?: string | null
          tournament_type?: string | null
        }
        Relationships: []
      }
      trade_offers: {
        Row: {
          additional_value_offered: number | null
          additional_value_requested: number | null
          created_at: string
          id: string
          match_id: string | null
          message: string | null
          parent_offer_id: string | null
          proposed_products: string[]
          receiver_id: string
          responded_at: string | null
          sender_id: string
          status: string
        }
        Insert: {
          additional_value_offered?: number | null
          additional_value_requested?: number | null
          created_at?: string
          id?: string
          match_id?: string | null
          message?: string | null
          parent_offer_id?: string | null
          proposed_products?: string[]
          receiver_id: string
          responded_at?: string | null
          sender_id: string
          status?: string
        }
        Update: {
          additional_value_offered?: number | null
          additional_value_requested?: number | null
          created_at?: string
          id?: string
          match_id?: string | null
          message?: string | null
          parent_offer_id?: string | null
          proposed_products?: string[]
          receiver_id?: string
          responded_at?: string | null
          sender_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_offers_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_offers_parent_offer_id_fkey"
            columns: ["parent_offer_id"]
            isOneToOne: false
            referencedRelation: "trade_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      trueke_insurance: {
        Row: {
          claim_reason: string | null
          claim_status: string | null
          coverage_amount: number
          created_at: string | null
          expires_at: string
          id: string
          match_id: string | null
          premium_paid: number
          status: string | null
          user_id: string
        }
        Insert: {
          claim_reason?: string | null
          claim_status?: string | null
          coverage_amount: number
          created_at?: string | null
          expires_at: string
          id?: string
          match_id?: string | null
          premium_paid: number
          status?: string | null
          user_id: string
        }
        Update: {
          claim_reason?: string | null
          claim_status?: string | null
          coverage_amount?: number
          created_at?: string | null
          expires_at?: string
          id?: string
          match_id?: string | null
          premium_paid?: number
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trueke_insurance_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      trueke_stories: {
        Row: {
          caption: string | null
          created_at: string | null
          expires_at: string
          id: string
          media_type: string | null
          media_url: string
          product_id: string | null
          user_id: string
          views_count: number | null
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          expires_at: string
          id?: string
          media_type?: string | null
          media_url: string
          product_id?: string | null
          user_id: string
          views_count?: number | null
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          expires_at?: string
          id?: string
          media_type?: string | null
          media_url?: string
          product_id?: string | null
          user_id?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "trueke_stories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "hot_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trueke_stories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      trukoin_escrow: {
        Row: {
          amount: number
          created_at: string | null
          dispute_reason: string | null
          id: string
          match_id: string | null
          payer_id: string
          receiver_id: string
          released_at: string | null
          status: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          dispute_reason?: string | null
          id?: string
          match_id?: string | null
          payer_id: string
          receiver_id: string
          released_at?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          dispute_reason?: string | null
          id?: string
          match_id?: string | null
          payer_id?: string
          receiver_id?: string
          released_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trukoin_escrow_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      trukoin_transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          reference_id: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      trukoin_wallets: {
        Row: {
          balance: number | null
          created_at: string | null
          id: string
          lifetime_earned: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          id?: string
          lifetime_earned?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          id?: string
          lifetime_earned?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string | null
          id: string
          progress: number | null
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id?: string | null
          id?: string
          progress?: number | null
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string | null
          id?: string
          progress?: number | null
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_stats: {
        Row: {
          avg_response_time_minutes: number | null
          created_at: string | null
          current_streak: number | null
          id: string
          last_active_at: string | null
          longest_streak: number | null
          total_likes_given: number | null
          total_likes_received: number | null
          total_messages_sent: number | null
          total_products_listed: number | null
          total_swipes: number | null
          total_trades_completed: number | null
          total_trades_initiated: number | null
          total_value_traded: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avg_response_time_minutes?: number | null
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_active_at?: string | null
          longest_streak?: number | null
          total_likes_given?: number | null
          total_likes_received?: number | null
          total_messages_sent?: number | null
          total_products_listed?: number | null
          total_swipes?: number | null
          total_trades_completed?: number | null
          total_trades_initiated?: number | null
          total_value_traded?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avg_response_time_minutes?: number | null
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_active_at?: string | null
          longest_streak?: number | null
          total_likes_given?: number | null
          total_likes_received?: number | null
          total_messages_sent?: number | null
          total_products_listed?: number | null
          total_swipes?: number | null
          total_trades_completed?: number | null
          total_trades_initiated?: number | null
          total_value_traded?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_boosts: {
        Row: {
          boost_type: string
          created_at: string
          ends_at: string
          id: string
          multiplier: number
          starts_at: string
          user_id: string
        }
        Insert: {
          boost_type?: string
          created_at?: string
          ends_at: string
          id?: string
          multiplier?: number
          starts_at?: string
          user_id: string
        }
        Update: {
          boost_type?: string
          created_at?: string
          ends_at?: string
          id?: string
          multiplier?: number
          starts_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_favorite_categories: {
        Row: {
          category: string
          created_at: string
          id: string
          priority: number
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          priority?: number
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          priority?: number
          user_id?: string
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      user_levels: {
        Row: {
          created_at: string
          experience_points: number
          id: string
          level: number
          total_likes_given: number
          total_likes_received: number
          total_products_listed: number
          total_trades: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          experience_points?: number
          id?: string
          level?: number
          total_likes_given?: number
          total_likes_received?: number
          total_products_listed?: number
          total_trades?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          experience_points?: number
          id?: string
          level?: number
          total_likes_given?: number
          total_likes_received?: number
          total_products_listed?: number
          total_trades?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_missions: {
        Row: {
          assigned_at: string | null
          completed_at: string | null
          current_progress: number | null
          id: string
          mission_id: string | null
          reward_claimed_at: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          completed_at?: string | null
          current_progress?: number | null
          id?: string
          mission_id?: string | null
          reward_claimed_at?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          completed_at?: string | null
          current_progress?: number | null
          id?: string
          mission_id?: string | null
          reward_claimed_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_missions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_streaks: {
        Row: {
          created_at: string | null
          current_streak: number | null
          id: string
          last_activity_date: string | null
          longest_streak: number | null
          streak_multiplier: number | null
          total_streak_bonus_earned: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          longest_streak?: number | null
          streak_multiplier?: number | null
          total_streak_bonus_earned?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          longest_streak?: number | null
          streak_multiplier?: number | null
          total_streak_bonus_earned?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          cancelled_at: string | null
          created_at: string
          expires_at: string | null
          expiry_notified_at: string | null
          id: string
          plan_id: string
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          expires_at?: string | null
          expiry_notified_at?: string | null
          id?: string
          plan_id: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          expires_at?: string | null
          expiry_notified_at?: string | null
          id?: string
          plan_id?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "premium_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          document_url: string
          id: string
          reviewed_at: string | null
          selfie_url: string
          status: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          document_url: string
          id?: string
          reviewed_at?: string | null
          selfie_url: string
          status?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          document_url?: string
          id?: string
          reviewed_at?: string | null
          selfie_url?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      video_verifications: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          match_id: string | null
          notes: string | null
          product_id: string | null
          requester_id: string
          scheduled_at: string | null
          status: string | null
          verification_result: string | null
          verifier_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          match_id?: string | null
          notes?: string | null
          product_id?: string | null
          requester_id: string
          scheduled_at?: string | null
          status?: string | null
          verification_result?: string | null
          verifier_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          match_id?: string | null
          notes?: string | null
          product_id?: string | null
          requester_id?: string
          scheduled_at?: string | null
          status?: string | null
          verification_result?: string | null
          verifier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_verifications_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_verifications_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "hot_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_verifications_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlists: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          fulfilled_at: string | null
          fulfilled_by_product_id: string | null
          id: string
          is_public: boolean | null
          max_value: number | null
          min_value: number | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          fulfilled_at?: string | null
          fulfilled_by_product_id?: string | null
          id?: string
          is_public?: boolean | null
          max_value?: number | null
          min_value?: number | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          fulfilled_at?: string | null
          fulfilled_by_product_id?: string | null
          id?: string
          is_public?: boolean | null
          max_value?: number | null
          min_value?: number | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_fulfilled_by_product_id_fkey"
            columns: ["fulfilled_by_product_id"]
            isOneToOne: false
            referencedRelation: "hot_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlists_fulfilled_by_product_id_fkey"
            columns: ["fulfilled_by_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      hot_products: {
        Row: {
          active_boost: number | null
          additional_value: number | null
          category: string | null
          condition: string | null
          created_at: string | null
          description: string | null
          estimated_value: number | null
          expires_at: string | null
          expiry_notified_1day: boolean | null
          expiry_notified_3days: boolean | null
          featured_multiplier: number | null
          hot_score: number | null
          id: string | null
          images: string[] | null
          latitude: number | null
          like_count: number | null
          location: string | null
          longitude: number | null
          premium_boost: number | null
          product_type: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
      profiles_public: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          id: string | null
          is_verified: boolean | null
          updated_at: string | null
          user_id: string | null
          user_type: string | null
          verified_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          is_verified?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          user_type?: string | null
          verified_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          is_verified?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          user_type?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      renew_product_expiry: { Args: { product_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
