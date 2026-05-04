# CreatorPulse Trend Scraper

Python + Playwright scraper that fetches real trending hashtags from:
- **TikTok Creative Center** (primary — actual trending data per region)
- **Google Trends** (supplement + fallback)

Results are pushed to Supabase `trend_cache` every 6 hours.

## Setup

```bash
cd scraper
pip install -r requirements.txt
playwright install chromium
```

## Run manually

```bash
python trend_scraper.py
```

## Schedule (Linux cron — every 6 hours)

```bash
crontab -e
```

Add:
```
0 */6 * * * cd /path/to/AfricSocial\ Hub && python scraper/trend_scraper.py >> scraper/scraper.log 2>&1
```

## Deploy on a VPS (recommended)

The scraper needs a persistent server since Vercel/Supabase Edge Functions can't run Playwright.

**Option A — Ubuntu VPS (cheapest, ~$4/mo on DigitalOcean/Hetzner):**
```bash
# Install dependencies
sudo apt update && sudo apt install -y python3-pip python3-venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
playwright install chromium
playwright install-deps chromium

# Set env vars
cp ../.env.local .env.local  # scraper reads from parent .env.local

# Add cron
crontab -e
# 0 */6 * * * cd /home/ubuntu/AfricSocial\ Hub && /home/ubuntu/AfricSocial\ Hub/venv/bin/python scraper/trend_scraper.py >> scraper/scraper.log 2>&1
```

**Option B — GitHub Actions (free, no VPS needed):**

Create `.github/workflows/trend-scraper.yml`:
```yaml
name: Trend Scraper
on:
  schedule:
    - cron: '0 */6 * * *'
  workflow_dispatch:

jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - run: pip install -r scraper/requirements.txt
      - run: playwright install chromium && playwright install-deps chromium
      - run: python scraper/trend_scraper.py
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

Add `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to GitHub repo secrets.

## How it works

1. For each region (KE, NG, ZA, US, GB):
   - Playwright opens TikTok Creative Center in headless Chromium
   - Extracts top 20 trending hashtags with post counts
   - pytrends fetches Google Trends daily searches (no browser needed)
   - Results are merged (TikTok takes priority, Google fills gaps)
   - Pushed to `trend_cache` with 6-hour expiry

2. The Next.js app reads from `trend_cache` — no scraping at request time.

## TikTok Creative Center URL

```
https://ads.tiktok.com/business/creativecenter/hashtag/pc/en?region=KE&period=7
```

Regions: `KE`, `NG`, `ZA`, `US`, `GB`
Periods: `7` (7 days), `30` (30 days), `120` (120 days)
