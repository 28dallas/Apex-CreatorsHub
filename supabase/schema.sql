-- ============================================================
-- CreatorPulse — Supabase Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- ============================================================
-- USERS (extends Supabase auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  full_name     TEXT,
  avatar_url    TEXT,
  username      TEXT UNIQUE,
  tier          TEXT NOT NULL DEFAULT 'starter' CHECK (tier IN ('starter', 'growth', 'agency')),
  tier_expires_at TIMESTAMPTZ,
  language      TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en','sw','fr','pt','ar','hi','es','de','yo','ig')),
  niche_tags    TEXT[] NOT NULL DEFAULT '{}',
  onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_data" ON public.users
  FOR ALL USING (auth.uid() = id);

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- SOCIAL ACCOUNTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.social_accounts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  platform        TEXT NOT NULL CHECK (platform IN ('tiktok','instagram','twitter','youtube','linkedin','pinterest','snapchat')),
  platform_user_id TEXT NOT NULL,
  username        TEXT NOT NULL,
  display_name    TEXT,
  avatar_url      TEXT,
  follower_count  INTEGER DEFAULT 0,
  -- Tokens stored in Supabase Vault — vault_secret_id references vault.secrets
  vault_secret_id UUID,
  token_expires_at TIMESTAMPTZ,
  scopes          TEXT[],
  account_age_days INTEGER GENERATED ALWAYS AS (
    EXTRACT(DAY FROM NOW() - created_at)::INTEGER
  ) STORED,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, platform, platform_user_id)
);

ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_data_only" ON public.social_accounts
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- TREND CACHE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.trend_cache (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform    TEXT NOT NULL CHECK (platform IN ('tiktok','instagram','twitter','youtube','linkedin','pinterest')),
  region      TEXT NOT NULL CHECK (region IN ('KE','NG','ZA','US','GB','IN','BR','DE','FR','EG','GH','TZ','UG')),
  trend_type  TEXT NOT NULL CHECK (trend_type IN ('sound', 'hashtag', 'topic')),
  data        JSONB NOT NULL,
  fetched_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '6 hours')
);

ALTER TABLE public.trend_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_trends" ON public.trend_cache
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only service role can insert/update trends
CREATE POLICY "service_write_trends" ON public.trend_cache
  FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX idx_trend_cache_region_platform ON public.trend_cache(region, platform);
CREATE INDEX idx_trend_cache_expires ON public.trend_cache(expires_at);

-- ============================================================
-- BOOST ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.boost_orders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  social_account_id UUID NOT NULL REFERENCES public.social_accounts(id),
  platform        TEXT NOT NULL,
  post_url        TEXT NOT NULL,
  service_type    TEXT NOT NULL CHECK (service_type IN ('likes', 'views', 'followers', 'comments')),
  quantity        INTEGER NOT NULL,
  -- Pricing
  smm_cost_usd    NUMERIC(10,4) NOT NULL,
  user_pays_usd   NUMERIC(10,4) NOT NULL, -- smm_cost * 1.4
  -- Safety tier snapshot at time of order
  safety_tier     TEXT NOT NULL CHECK (safety_tier IN ('new', 'growing', 'established')),
  -- External order tracking
  exobooster_order_id TEXT,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  -- Cooldown enforcement
  post_identifier TEXT NOT NULL, -- hash of post_url for cooldown lookup
  -- M-Pesa payment gate (SMM panel only called after ResultCode: 0)
  mpesa_checkout_id TEXT,
  payment_status  TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'failed')),
  -- Provider tracking
  provider_used   TEXT,                     -- smmwiz | jap | yoyomedia | prm4u
  drip_feed       BOOLEAN NOT NULL DEFAULT TRUE,
  fx_rate_at_order NUMERIC(10,4),           -- KES/USD or NGN/USD at time of order
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

ALTER TABLE public.boost_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_boost_orders" ON public.boost_orders
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_boost_orders_user ON public.boost_orders(user_id);
CREATE INDEX idx_boost_orders_post_cooldown ON public.boost_orders(post_identifier, created_at DESC);

-- ============================================================
-- POST ANALYTICS (for heatmap)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.post_analytics (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  social_account_id UUID NOT NULL REFERENCES public.social_accounts(id),
  platform          TEXT NOT NULL,
  post_id           TEXT NOT NULL,
  posted_at         TIMESTAMPTZ NOT NULL,
  day_of_week       SMALLINT GENERATED ALWAYS AS (EXTRACT(DOW FROM posted_at)::SMALLINT) STORED, -- 0=Sun
  hour_of_day       SMALLINT GENERATED ALWAYS AS (EXTRACT(HOUR FROM posted_at)::SMALLINT) STORED,
  likes             INTEGER DEFAULT 0,
  comments          INTEGER DEFAULT 0,
  shares            INTEGER DEFAULT 0,
  views             INTEGER DEFAULT 0,
  engagement_rate   NUMERIC(5,4),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.post_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_analytics" ON public.post_analytics
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_post_analytics_heatmap ON public.post_analytics(user_id, day_of_week, hour_of_day);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tier                TEXT NOT NULL CHECK (tier IN ('growth', 'agency')),
  payment_provider    TEXT NOT NULL CHECK (payment_provider IN ('mpesa', 'stripe', 'intasend')),
  provider_sub_id     TEXT, -- Stripe subscription ID or M-Pesa checkout ID
  amount_kes          NUMERIC(10,2),
  amount_usd          NUMERIC(10,2),
  status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end  TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_subscriptions" ON public.subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- HELPER: updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_social_accounts_updated_at BEFORE UPDATE ON public.social_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- CONTENT CALENDAR
-- ============================================================
CREATE TABLE IF NOT EXISTS public.content_calendar (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  platform    TEXT NOT NULL CHECK (platform IN ('tiktok', 'instagram', 'twitter', 'youtube')),
  niche       TEXT NOT NULL,
  region      TEXT NOT NULL,
  caption     TEXT,
  hook        TEXT,
  hashtags    TEXT[],
  trend_used  TEXT,
  status      TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'posted', 'skipped')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.content_calendar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_calendar" ON public.content_calendar FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_calendar_user_date ON public.content_calendar(user_id, scheduled_date);

-- ============================================================
-- HOOK LIBRARY
-- ============================================================
CREATE TABLE IF NOT EXISTS public.hook_library (
  id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  niche   TEXT NOT NULL,
  region  TEXT NOT NULL DEFAULT 'ALL',
  hook    TEXT NOT NULL,
  format  TEXT NOT NULL DEFAULT 'short_video',
  saves   INTEGER DEFAULT 0
);

ALTER TABLE public.hook_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_hooks" ON public.hook_library FOR SELECT USING (auth.role() = 'authenticated');

-- Seed hook library with proven hooks
INSERT INTO public.hook_library (niche, region, hook, format) VALUES
  ('Fitness', 'KE', 'POV: you''re a Nairobi fitness coach and your client just hit their first pull-up', 'short_video'),
  ('Fitness', 'KE', 'I trained every day for 30 days in Nairobi — here''s what nobody tells you', 'short_video'),
  ('Fitness', 'ALL', 'Stop doing this exercise if you want abs — do this instead', 'short_video'),
  ('Food', 'KE', 'This KES 200 meal from Gikomba changed how I eat forever', 'short_video'),
  ('Food', 'KE', 'POV: you asked a Nairobi mama to teach you her secret recipe', 'short_video'),
  ('Food', 'ALL', 'I ate this every day for a week and here''s what happened', 'short_video'),
  ('Comedy', 'KE', 'Things Kenyans say that hit different at 2am', 'short_video'),
  ('Comedy', 'KE', 'POV: you''re the only one who didn''t get the memo at a Kenyan wedding', 'short_video'),
  ('Comedy', 'NG', 'Things Nigerians say that make zero sense to outsiders', 'short_video'),
  ('Fashion', 'KE', 'I styled 5 outfits from Gikomba for under KES 1,000', 'short_video'),
  ('Fashion', 'ALL', 'This one styling trick makes any outfit look expensive', 'short_video'),
  ('Tech', 'KE', 'The app every Kenyan freelancer needs but nobody talks about', 'short_video'),
  ('Tech', 'ALL', 'I automated my entire workflow with this free tool', 'short_video'),
  ('Business', 'KE', 'How I made my first KES 100k online without leaving Nairobi', 'short_video'),
  ('Business', 'ALL', 'The business mistake that cost me everything — don''t do this', 'short_video'),
  ('Education', 'KE', 'What Kenyan schools never taught you about money', 'short_video'),
  ('Music', 'KE', 'This Kenyan sound is about to blow up globally — here''s why', 'short_video'),
  ('Lifestyle', 'KE', 'A day in my life as a Nairobi content creator (honest version)', 'short_video'),
  ('Gaming', 'ALL', 'I played this game for 10 hours straight — here''s my honest review', 'short_video'),
  ('Travel', 'KE', 'Hidden spots in Kenya that tourists never find', 'short_video')
ON CONFLICT DO NOTHING;

-- ============================================================
-- COMPETITOR TRACKING
-- ============================================================
CREATE TABLE IF NOT EXISTS public.competitor_tracks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  platform        TEXT NOT NULL,
  handle          TEXT NOT NULL,
  display_name    TEXT,
  follower_count  INTEGER DEFAULT 0,
  last_checked_at TIMESTAMPTZ,
  snapshots       JSONB DEFAULT '[]',  -- [{date, followers, top_post_url}]
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, platform, handle)
);

ALTER TABLE public.competitor_tracks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_competitors" ON public.competitor_tracks FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- MEDIA KITS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.media_kits (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  niche       TEXT NOT NULL,
  bio         TEXT,
  rate_card   JSONB DEFAULT '{}',  -- {story: 5000, reel: 15000, dedicated: 30000}
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE public.media_kits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_media_kit" ON public.media_kits FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- CREATOR VOICE (extracted writing style per user)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.creator_voice (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  writing_style   TEXT NOT NULL DEFAULT '',
  common_phrases  TEXT[] NOT NULL DEFAULT '{}',
  avg_caption_length INTEGER NOT NULL DEFAULT 0,
  tone            TEXT NOT NULL DEFAULT 'relatable',
  sample_captions TEXT[] NOT NULL DEFAULT '{}',
  analyzed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.creator_voice ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_voice" ON public.creator_voice FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- PLAN RESULTS (feedback loop: plan vs actual)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.plan_results (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_date           DATE NOT NULL,
  recommended_time    TEXT NOT NULL,
  actual_post_time    TEXT,
  predicted_engagement NUMERIC(5,2),
  actual_engagement   NUMERIC(5,2),
  followed_plan       BOOLEAN,
  platform            TEXT NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.plan_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_plan_results" ON public.plan_results FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_plan_results_user_date ON public.plan_results(user_id, plan_date DESC);

-- ============================================================
-- FOLLOWER SNAPSHOTS (daily follower count history)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.follower_snapshots (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  social_account_id UUID NOT NULL REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  follower_count    INTEGER NOT NULL,
  snapped_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.follower_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_snapshots" ON public.follower_snapshots FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_snapshots_account_time ON public.follower_snapshots(social_account_id, snapped_at DESC);

-- ============================================================
-- FOLLOWER SNAPSHOT CRON (daily at midnight UTC)
-- Requires pg_cron extension (enabled above)
-- ============================================================
SELECT cron.schedule(
  'daily-follower-snapshot',
  '0 0 * * *',
  $$
    INSERT INTO public.follower_snapshots (user_id, social_account_id, follower_count)
    SELECT user_id, id, follower_count
    FROM public.social_accounts;
  $$
);

-- ============================================================
-- VAULT: Store OAuth tokens securely
-- Usage: SELECT vault.create_secret('token_value', 'label', 'description');
-- Returns a UUID — store that UUID in social_accounts.vault_secret_id
-- ============================================================
-- vault extension is enabled by default in Supabase projects
-- No additional SQL needed — use the vault API from server-side only
