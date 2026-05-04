# CreatorPulse

AI-powered social media growth SaaS for content creators in Kenya and Africa.

## Tech Stack

- **Frontend**: Next.js 15 (App Router) · React 19 · TypeScript
- **UI**: Tailwind CSS v4 · Shadcn/UI · Lucide Icons · Recharts
- **Backend**: Supabase (PostgreSQL + RLS + Vault + Edge Functions)
- **Auth**: Supabase Auth · OAuth 2.0 PKCE (TikTok, Instagram, Twitter/X, YouTube)
- **AI**: GPT-4o (OpenAI)
- **Payments KE**: Daraja API (M-Pesa STK Push)
- **Payments Global**: Stripe
- **Deployment**: Vercel (Edge Runtime)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Supabase setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the SQL Editor
3. Enable the Vault extension (Settings → Extensions → vault)
4. Copy your project URL and anon key

### 3. Environment variables

Copy `.env.local` and fill in all values. **Never commit this file.**

```bash
cp .env.local .env.local.example  # keep example without secrets
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `DARAJA_*` (get from [developer.safaricom.co.ke](https://developer.safaricom.co.ke))
- `STRIPE_*` (get from [dashboard.stripe.com](https://dashboard.stripe.com))
- `TIKTOK_*` (get from [developers.tiktok.com](https://developers.tiktok.com))
- `INSTAGRAM_*` (get from [developers.facebook.com](https://developers.facebook.com))

### 4. Run locally

```bash
npm run dev
```

### 5. Deploy Supabase Edge Function

```bash
supabase functions deploy trend-engine
supabase functions schedule trend-engine --cron "0 */6 * * *"
```

### 6. Deploy to Vercel

```bash
vercel --prod
```

Add all environment variables in Vercel dashboard → Settings → Environment Variables.

## Architecture

```
src/
├── app/
│   ├── (auth)/login          # OAuth login page
│   ├── (auth)/callback       # Supabase OAuth callback
│   ├── (dashboard)/
│   │   ├── dashboard         # Overview + connected accounts
│   │   ├── trends            # Trend Engine UI (region/platform filter)
│   │   ├── ai-assistant      # GPT-4o growth plan generator
│   │   ├── heatmap           # 7×24 post timing heatmap
│   │   ├── boost             # SMM Booster with safety throttler
│   │   └── billing           # M-Pesa + Stripe subscriptions
│   └── api/
│       ├── auth/tiktok       # TikTok OAuth flow
│       ├── auth/instagram    # Instagram OAuth flow
│       └── payments/
│           ├── mpesa         # Daraja STK Push + callback
│           └── stripe        # Checkout session + webhook
├── components/
│   ├── dashboard/            # Sidebar, MobileNav
│   └── heatmap/              # PostHeatmap (Recharts)
├── lib/
│   ├── supabase/             # client, server, middleware, types
│   ├── ai/                   # GPT-4o growth assistant
│   ├── smm/                  # Boost server action + safety throttler
│   └── payments/             # Daraja + Stripe utilities
supabase/
├── schema.sql                # Full DB schema + RLS policies
└── functions/trend-engine/   # Edge Function cron job
```

## Safety & Security

- All OAuth tokens stored in **Supabase Vault** (encrypted at rest) — never in plain text
- RLS enabled on ALL tables — users can only access their own data
- SMM Booster has mandatory safety throttler:
  - New accounts (< 30 days): max 500/order
  - Growing (30–90 days): max 2,000/order
  - Established (> 90 days, > 10k followers): max 10,000/order
  - 48-hour cooldown between boost orders per post
- No secrets committed to git (`.env.local` in `.gitignore`)
- Stripe webhook signature verified on every request

## Monetization

| Stream | Details |
|--------|---------|
| Subscriptions | Growth KES 1,950/mo · Agency KES 5,850/mo |
| SMM Arbitrage | 40% markup on Exobooster orders |
| Affiliate | Jumia API + Amazon Associates |

## Build Order (recommended)

1. ✅ Supabase schema + RLS
2. ✅ Next.js 15 + Supabase client config
3. ✅ OAuth flows (TikTok + Instagram) + Vault token storage
4. ✅ Trend Engine Edge Function + cron
5. ✅ Heatmap component (Recharts)
6. ✅ AI assistant (GPT-4o)
7. ✅ Daraja M-Pesa STK Push
8. ✅ SMM Booster + safety throttler
9. ✅ Stripe payments + webhook
10. ⬜ Vercel deployment + env vars
