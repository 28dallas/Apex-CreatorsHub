export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type Platform = "tiktok" | "instagram" | "twitter" | "youtube" | "linkedin" | "pinterest" | "snapchat";
export type Region = "KE" | "NG" | "ZA" | "US" | "GB" | "IN" | "BR" | "DE" | "FR" | "EG" | "GH" | "TZ" | "UG";
export type Language = "en" | "sw" | "fr" | "pt" | "ar" | "hi" | "es" | "de" | "yo" | "ig";
export type Tier = "starter" | "growth" | "agency";
export type SafetyTier = "new" | "growing" | "established";
export type BoostStatus = "pending" | "processing" | "completed" | "failed" | "refunded";
export type CalendarStatus = "planned" | "posted" | "skipped";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          username: string | null;
          tier: Tier;
          tier_expires_at: string | null;
          language: Language;
          niche_tags: string[];
          onboarding_complete: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["users"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
      };
      social_accounts: {
        Row: {
          id: string;
          user_id: string;
          platform: Platform;
          platform_user_id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          follower_count: number;
          vault_secret_id: string | null;
          token_expires_at: string | null;
          scopes: string[] | null;
          account_age_days: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["social_accounts"]["Row"], "account_age_days" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["social_accounts"]["Insert"]>;
      };
      trend_cache: {
        Row: {
          id: string;
          platform: Platform;
          region: Region;
          trend_type: "sound" | "hashtag" | "topic";
          data: Json;
          fetched_at: string;
          expires_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["trend_cache"]["Row"], "id" | "fetched_at">;
        Update: Partial<Database["public"]["Tables"]["trend_cache"]["Insert"]>;
      };
      boost_orders: {
        Row: {
          id: string;
          user_id: string;
          social_account_id: string;
          platform: Platform;
          post_url: string;
          service_type: "likes" | "views" | "followers" | "comments";
          quantity: number;
          smm_cost_usd: number;
          user_pays_usd: number;
          safety_tier: SafetyTier;
          exobooster_order_id: string | null;
          status: BoostStatus;
          post_identifier: string;
          mpesa_checkout_id: string | null;
          payment_status: "unpaid" | "paid" | "failed";
          provider_used: string | null;
          drip_feed: boolean;
          fx_rate_at_order: number | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["boost_orders"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["boost_orders"]["Insert"]>;
      };
      post_analytics: {
        Row: {
          id: string;
          user_id: string;
          social_account_id: string;
          platform: Platform;
          post_id: string;
          posted_at: string;
          day_of_week: number;
          hour_of_day: number;
          likes: number;
          comments: number;
          shares: number;
          views: number;
          engagement_rate: number | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["post_analytics"]["Row"], "id" | "day_of_week" | "hour_of_day" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["post_analytics"]["Insert"]>;
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          tier: "growth" | "agency";
          payment_provider: "mpesa" | "stripe" | "intasend";
          provider_sub_id: string | null;
          amount_kes: number | null;
          amount_usd: number | null;
          status: "active" | "cancelled" | "past_due" | "trialing";
          current_period_start: string | null;
          current_period_end: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["subscriptions"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Insert"]>;
      };
      content_calendar: {
        Row: {
          id: string;
          user_id: string;
          scheduled_date: string;
          platform: Platform;
          niche: string;
          region: string;
          caption: string | null;
          hook: string | null;
          hashtags: string[] | null;
          trend_used: string | null;
          status: CalendarStatus;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["content_calendar"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["content_calendar"]["Insert"]>;
      };
      hook_library: {
        Row: {
          id: string;
          niche: string;
          region: string;
          hook: string;
          format: string;
          saves: number;
        };
        Insert: Omit<Database["public"]["Tables"]["hook_library"]["Row"], "id" | "saves">;
        Update: Partial<Database["public"]["Tables"]["hook_library"]["Insert"]>;
      };
      competitor_tracks: {
        Row: {
          id: string;
          user_id: string;
          platform: Platform;
          handle: string;
          display_name: string | null;
          follower_count: number;
          last_checked_at: string | null;
          snapshots: Json;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["competitor_tracks"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["competitor_tracks"]["Insert"]>;
      };
      media_kits: {
        Row: {
          id: string;
          user_id: string;
          niche: string;
          bio: string | null;
          rate_card: Json;
          generated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["media_kits"]["Row"], "id" | "generated_at">;
        Update: Partial<Database["public"]["Tables"]["media_kits"]["Insert"]>;
      };
      creator_voice: {
        Row: {
          id: string;
          user_id: string;
          writing_style: string;
          common_phrases: string[];
          avg_caption_length: number;
          tone: string;
          sample_captions: string[];
          analyzed_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["creator_voice"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["creator_voice"]["Insert"]>;
      };
      plan_results: {
        Row: {
          id: string;
          user_id: string;
          plan_date: string;
          recommended_time: string;
          actual_post_time: string | null;
          predicted_engagement: number | null;
          actual_engagement: number | null;
          followed_plan: boolean | null;
          platform: Platform;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["plan_results"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["plan_results"]["Insert"]>;
      };
      follower_snapshots: {
        Row: {
          id: string;
          user_id: string;
          social_account_id: string;
          follower_count: number;
          snapped_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["follower_snapshots"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["follower_snapshots"]["Insert"]>;
      };
    };
  };
}
