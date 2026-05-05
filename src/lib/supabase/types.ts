export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Platform =
  | "tiktok"
  | "instagram"
  | "twitter"
  | "youtube"
  | "linkedin"
  | "pinterest"
  | "snapchat";
export type Region =
  | "KE"
  | "NG"
  | "ZA"
  | "US"
  | "GB"
  | "IN"
  | "BR"
  | "DE"
  | "FR"
  | "EG"
  | "GH"
  | "TZ"
  | "UG";
export type Language =
  | "en"
  | "sw"
  | "fr"
  | "pt"
  | "ar"
  | "hi"
  | "es"
  | "de"
  | "yo"
  | "ig";
export type Tier = "starter" | "growth" | "agency";
export type SafetyTier = "new" | "growing" | "established";
export type BoostStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "refunded";
export type CalendarStatus = "planned" | "posted" | "skipped";

type TableDefinition<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      users: TableDefinition<
        {
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
        },
        {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          username?: string | null;
          tier?: Tier;
          tier_expires_at?: string | null;
          language?: Language;
          niche_tags?: string[];
          onboarding_complete?: boolean;
        },
        {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          username?: string | null;
          tier?: Tier;
          tier_expires_at?: string | null;
          language?: Language;
          niche_tags?: string[];
          onboarding_complete?: boolean;
        }
      >;
      social_accounts: TableDefinition<
        {
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
        },
        {
          id?: string;
          user_id: string;
          platform: Platform;
          platform_user_id: string;
          username: string;
          display_name?: string | null;
          avatar_url?: string | null;
          follower_count?: number;
          vault_secret_id?: string | null;
          token_expires_at?: string | null;
          scopes?: string[] | null;
        },
        Partial<{
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
        }>
      >;
      trend_cache: TableDefinition<
        {
          id: string;
          platform: Platform;
          region: Region;
          trend_type: "sound" | "hashtag" | "topic";
          data: Json;
          fetched_at: string;
          expires_at: string;
        },
        {
          id?: string;
          platform: Platform;
          region: Region;
          trend_type: "sound" | "hashtag" | "topic";
          data: Json;
          expires_at: string;
        },
        Partial<{
          id: string;
          platform: Platform;
          region: Region;
          trend_type: "sound" | "hashtag" | "topic";
          data: Json;
          fetched_at: string;
          expires_at: string;
        }>
      >;
      boost_orders: TableDefinition<
        {
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
        },
        {
          id?: string;
          user_id: string;
          social_account_id: string;
          platform: Platform;
          post_url: string;
          service_type: "likes" | "views" | "followers" | "comments";
          quantity: number;
          smm_cost_usd: number;
          user_pays_usd: number;
          safety_tier: SafetyTier;
          exobooster_order_id?: string | null;
          status: BoostStatus;
          post_identifier: string;
          mpesa_checkout_id?: string | null;
          payment_status: "unpaid" | "paid" | "failed";
          provider_used?: string | null;
          drip_feed?: boolean;
          fx_rate_at_order?: number | null;
          completed_at?: string | null;
        },
        Partial<{
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
          completed_at: string | null;
        }>
      >;
      post_analytics: TableDefinition<
        {
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
        },
        {
          id?: string;
          user_id: string;
          social_account_id: string;
          platform: Platform;
          post_id: string;
          posted_at: string;
          likes?: number;
          comments?: number;
          shares?: number;
          views?: number;
          engagement_rate?: number | null;
        },
        Partial<{
          id: string;
          user_id: string;
          social_account_id: string;
          platform: Platform;
          post_id: string;
          posted_at: string;
          likes: number;
          comments: number;
          shares: number;
          views: number;
          engagement_rate: number | null;
        }>
      >;
      subscriptions: TableDefinition<
        {
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
        },
        {
          id?: string;
          user_id: string;
          tier: "growth" | "agency";
          payment_provider: "mpesa" | "stripe" | "intasend";
          provider_sub_id?: string | null;
          amount_kes?: number | null;
          amount_usd?: number | null;
          status: "active" | "cancelled" | "past_due" | "trialing";
          current_period_start?: string | null;
          current_period_end?: string | null;
        },
        Partial<{
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
        }>
      >;
      content_calendar: TableDefinition<
        {
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
        },
        {
          id?: string;
          user_id: string;
          scheduled_date: string;
          platform: Platform;
          niche: string;
          region: string;
          caption?: string | null;
          hook?: string | null;
          hashtags?: string[] | null;
          trend_used?: string | null;
          status?: CalendarStatus;
        },
        Partial<{
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
        }>
      >;
      hook_library: TableDefinition<
        {
          id: string;
          niche: string;
          region: string;
          hook: string;
          format: string;
          saves: number;
        },
        {
          id?: string;
          niche: string;
          region: string;
          hook: string;
          format: string;
          saves?: number;
        },
        Partial<{
          id: string;
          niche: string;
          region: string;
          hook: string;
          format: string;
          saves: number;
        }>
      >;
      competitor_tracks: TableDefinition<
        {
          id: string;
          user_id: string;
          platform: Platform;
          handle: string;
          display_name: string | null;
          follower_count: number;
          last_checked_at: string | null;
          snapshots: Json;
          created_at: string;
        },
        {
          id?: string;
          user_id: string;
          platform: Platform;
          handle: string;
          display_name?: string | null;
          follower_count?: number;
          last_checked_at?: string | null;
          snapshots?: Json;
        },
        Partial<{
          id: string;
          user_id: string;
          platform: Platform;
          handle: string;
          display_name: string | null;
          follower_count: number;
          last_checked_at: string | null;
          snapshots: Json;
        }>
      >;
      media_kits: TableDefinition<
        {
          id: string;
          user_id: string;
          niche: string;
          bio: string | null;
          rate_card: Json;
          generated_at: string;
        },
        {
          id?: string;
          user_id: string;
          niche: string;
          bio?: string | null;
          rate_card: Json;
          generated_at?: string;
        },
        Partial<{
          id: string;
          user_id: string;
          niche: string;
          bio: string | null;
          rate_card: Json;
          generated_at: string;
        }>
      >;
      creator_voice: TableDefinition<
        {
          id: string;
          user_id: string;
          writing_style: string;
          common_phrases: string[];
          avg_caption_length: number;
          tone: string;
          sample_captions: string[];
          analyzed_at: string;
        },
        {
          id?: string;
          user_id: string;
          writing_style: string;
          common_phrases: string[];
          avg_caption_length: number;
          tone: string;
          sample_captions: string[];
          analyzed_at: string;
        },
        Partial<{
          id: string;
          user_id: string;
          writing_style: string;
          common_phrases: string[];
          avg_caption_length: number;
          tone: string;
          sample_captions: string[];
          analyzed_at: string;
        }>
      >;
      plan_results: TableDefinition<
        {
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
        },
        {
          id?: string;
          user_id: string;
          plan_date: string;
          recommended_time: string;
          actual_post_time?: string | null;
          predicted_engagement?: number | null;
          actual_engagement?: number | null;
          followed_plan?: boolean | null;
          platform: Platform;
        },
        Partial<{
          id: string;
          user_id: string;
          plan_date: string;
          recommended_time: string;
          actual_post_time: string | null;
          predicted_engagement: number | null;
          actual_engagement: number | null;
          followed_plan: boolean | null;
          platform: Platform;
        }>
      >;
      follower_snapshots: TableDefinition<
        {
          id: string;
          user_id: string;
          social_account_id: string;
          follower_count: number;
          snapped_at: string;
        },
        {
          id?: string;
          user_id: string;
          social_account_id: string;
          follower_count: number;
          snapped_at: string;
        },
        Partial<{
          id: string;
          user_id: string;
          social_account_id: string;
          follower_count: number;
          snapped_at: string;
        }>
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
