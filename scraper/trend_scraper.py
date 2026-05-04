"""
CreatorPulse Trend Scraper
Scrapes TikTok Creative Center + Google Trends for KE and NG regions.
Pushes results to Supabase trend_cache table.

Setup:
    pip install playwright supabase python-dotenv pytrends
    playwright install chromium

Run:
    python scraper/trend_scraper.py

Schedule (cron every 6h):
    0 */6 * * * cd /path/to/project && python scraper/trend_scraper.py >> scraper/scraper.log 2>&1
"""

import asyncio
import json
import os
import re
import sys
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeout
from supabase import create_client, Client
from pytrends.request import TrendReq

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env.local"))

SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

# Region config
REGIONS = {
    "KE": {"tiktok_cc": "KE", "google_geo": "KE", "label": "Kenya"},
    "NG": {"tiktok_cc": "NG", "google_geo": "NG", "label": "Nigeria"},
    "ZA": {"tiktok_cc": "ZA", "google_geo": "ZA", "label": "South Africa"},
    "GH": {"tiktok_cc": "GH", "google_geo": "GH", "label": "Ghana"},
    "TZ": {"tiktok_cc": "TZ", "google_geo": "TZ", "label": "Tanzania"},
    "UG": {"tiktok_cc": "UG", "google_geo": "UG", "label": "Uganda"},
    "EG": {"tiktok_cc": "EG", "google_geo": "EG", "label": "Egypt"},
    "US": {"tiktok_cc": "US", "google_geo": "US", "label": "United States"},
    "GB": {"tiktok_cc": "GB", "google_geo": "GB", "label": "United Kingdom"},
    "IN": {"tiktok_cc": "IN", "google_geo": "IN", "label": "India"},
    "BR": {"tiktok_cc": "BR", "google_geo": "BR", "label": "Brazil"},
    "DE": {"tiktok_cc": "DE", "google_geo": "DE", "label": "Germany"},
    "FR": {"tiktok_cc": "FR", "google_geo": "FR", "label": "France"},
}

EXPIRES_IN_HOURS = 6


def get_supabase() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def expires_at() -> str:
    return (datetime.now(timezone.utc) + timedelta(hours=EXPIRES_IN_HOURS)).isoformat()


# ─── TikTok Creative Center Scraper ──────────────────────────────────────────

async def scrape_tiktok_creative_center(region_code: str) -> list[dict]:
    """
    Scrapes TikTok Creative Center trending hashtags for a given region.
    URL: https://ads.tiktok.com/business/creativecenter/hashtag/pc/en
    """
    url = f"https://ads.tiktok.com/business/creativecenter/hashtag/pc/en?region={region_code}&period=7"
    results = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
        )
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 800},
            locale="en-US",
        )
        page = await context.new_page()

        try:
            await page.goto(url, wait_until="networkidle", timeout=30000)

            # Wait for hashtag cards to load
            await page.wait_for_selector(
                "[class*='hashtagItem'], [class*='HashtagItem'], [data-e2e='hashtag-item']",
                timeout=15000,
            )

            # Extract hashtag data from the page
            items = await page.evaluate("""
                () => {
                    const results = [];
                    // Try multiple selectors — TikTok CC changes class names
                    const selectors = [
                        '[class*="hashtagItem"]',
                        '[class*="HashtagItem"]',
                        '[data-e2e="hashtag-item"]',
                        '.creative-center-hashtag-item',
                    ];

                    let cards = [];
                    for (const sel of selectors) {
                        cards = document.querySelectorAll(sel);
                        if (cards.length > 0) break;
                    }

                    cards.forEach((card, i) => {
                        const nameEl = card.querySelector('[class*="name"], [class*="Name"], h3, .hashtag-name');
                        const countEl = card.querySelector('[class*="postCount"], [class*="PostCount"], [class*="count"]');
                        const rankEl = card.querySelector('[class*="rank"], [class*="Rank"]');

                        const name = nameEl?.textContent?.trim().replace(/^#/, '') || '';
                        const countText = countEl?.textContent?.trim() || '0';

                        // Parse count: "1.2M" -> 1200000, "500K" -> 500000
                        let post_count = 0;
                        const match = countText.match(/([\\d.]+)([KMB]?)/i);
                        if (match) {
                            const num = parseFloat(match[1]);
                            const suffix = match[2].toUpperCase();
                            post_count = suffix === 'B' ? num * 1e9
                                       : suffix === 'M' ? num * 1e6
                                       : suffix === 'K' ? num * 1e3
                                       : num;
                        }

                        if (name) {
                            results.push({
                                hashtag: name,
                                post_count: Math.round(post_count),
                                rank: i + 1,
                                source: 'tiktok_creative_center',
                            });
                        }
                    });

                    return results.slice(0, 20);
                }
            """)

            results = items if items else []
            print(f"  [TikTok CC] {region_code}: {len(results)} hashtags scraped")

        except PlaywrightTimeout:
            print(f"  [TikTok CC] {region_code}: timeout — falling back to Google Trends")
        except Exception as e:
            print(f"  [TikTok CC] {region_code}: error — {e}")
        finally:
            await browser.close()

    return results


# ─── Google Trends Scraper ────────────────────────────────────────────────────

def scrape_google_trends(geo: str, region_code: str) -> list[dict]:
    """
    Fetches trending searches from Google Trends for a given country.
    Uses pytrends (no browser needed).
    """
    results = []
    try:
        pt = TrendReq(hl="en-US", tz=180 if geo in ("KE", "NG", "ZA") else 0, timeout=(10, 30))

        # Daily trending searches
        trending_df = pt.trending_searches(pn=_google_trends_country(geo))
        if trending_df is not None and not trending_df.empty:
            for i, row in trending_df.head(20).iterrows():
                topic = str(row.iloc[0]).strip()
                if topic:
                    results.append({
                        "hashtag": topic.replace(" ", ""),
                        "title": topic,
                        "post_count": 0,
                        "rank": i + 1,
                        "source": "google_trends",
                    })

        print(f"  [Google Trends] {region_code}: {len(results)} topics fetched")

    except Exception as e:
        print(f"  [Google Trends] {region_code}: error — {e}")

    return results


def _google_trends_country(geo: str) -> str:
    mapping = {
        "KE": "kenya", "NG": "nigeria", "ZA": "south_africa",
        "GH": "ghana", "TZ": "tanzania", "UG": "uganda", "EG": "egypt",
        "US": "united_states", "GB": "united_kingdom",
        "IN": "india", "BR": "brazil", "DE": "germany", "FR": "france",
    }
    return mapping.get(geo, "kenya")


# ─── Merge & Deduplicate ──────────────────────────────────────────────────────

def merge_trends(tiktok: list[dict], google: list[dict]) -> list[dict]:
    """
    Merges TikTok CC and Google Trends results.
    TikTok results take priority (ranked first), Google fills gaps.
    Deduplicates by hashtag name (case-insensitive).
    """
    seen = set()
    merged = []

    for item in tiktok:
        key = item["hashtag"].lower()
        if key not in seen:
            seen.add(key)
            merged.append(item)

    for item in google:
        key = item["hashtag"].lower()
        if key not in seen:
            seen.add(key)
            merged.append({**item, "rank": len(merged) + 1})

    return merged[:25]


# ─── Push to Supabase ─────────────────────────────────────────────────────────

def push_to_supabase(supabase: Client, region: str, platform: str, data: list[dict]) -> bool:
    if not data:
        print(f"  [Supabase] {region}/{platform}: no data to push, skipping")
        return False

    try:
        result = supabase.table("trend_cache").upsert(
            {
                "platform": platform,
                "region": region,
                "trend_type": "hashtag",
                "data": data,
                "fetched_at": datetime.now(timezone.utc).isoformat(),
                "expires_at": expires_at(),
            },
            # Upsert on platform+region combination (most recent row wins)
        ).execute()

        print(f"  [Supabase] {region}/{platform}: pushed {len(data)} items ✓")
        return True

    except Exception as e:
        print(f"  [Supabase] {region}/{platform}: push failed — {e}")
        return False


# ─── Instagram fallback hashtags (region-specific, curated) ──────────────────

INSTAGRAM_FALLBACK: dict[str, list[dict]] = {
    "KE": [
        {"hashtag": "NairobiLife", "post_count": 0, "rank": 1, "source": "curated"},
        {"hashtag": "KenyaCreators", "post_count": 0, "rank": 2, "source": "curated"},
        {"hashtag": "254Content", "post_count": 0, "rank": 3, "source": "curated"},
        {"hashtag": "NairobiCreators", "post_count": 0, "rank": 4, "source": "curated"},
        {"hashtag": "MadeInKenya", "post_count": 0, "rank": 5, "source": "curated"},
    ],
    "NG": [
        {"hashtag": "NigeriaTwitter", "post_count": 0, "rank": 1, "source": "curated"},
        {"hashtag": "LagosLife", "post_count": 0, "rank": 2, "source": "curated"},
        {"hashtag": "Naija", "post_count": 0, "rank": 3, "source": "curated"},
        {"hashtag": "AfroBeats", "post_count": 0, "rank": 4, "source": "curated"},
        {"hashtag": "MadeInNigeria", "post_count": 0, "rank": 5, "source": "curated"},
    ],
    "ZA": [
        {"hashtag": "Mzansi", "post_count": 0, "rank": 1, "source": "curated"},
        {"hashtag": "SouthAfrica", "post_count": 0, "rank": 2, "source": "curated"},
        {"hashtag": "JoburgLife", "post_count": 0, "rank": 3, "source": "curated"},
    ],
    "GH": [
        {"hashtag": "GhanaCreators", "post_count": 0, "rank": 1, "source": "curated"},
        {"hashtag": "AccraLife", "post_count": 0, "rank": 2, "source": "curated"},
        {"hashtag": "MadeInGhana", "post_count": 0, "rank": 3, "source": "curated"},
    ],
    "TZ": [
        {"hashtag": "TanzaniaCreators", "post_count": 0, "rank": 1, "source": "curated"},
        {"hashtag": "DarEsSalaam", "post_count": 0, "rank": 2, "source": "curated"},
    ],
    "UG": [
        {"hashtag": "UgandaCreators", "post_count": 0, "rank": 1, "source": "curated"},
        {"hashtag": "KampalaLife", "post_count": 0, "rank": 2, "source": "curated"},
    ],
    "EG": [
        {"hashtag": "EgyptCreators", "post_count": 0, "rank": 1, "source": "curated"},
        {"hashtag": "CairoLife", "post_count": 0, "rank": 2, "source": "curated"},
    ],
    "US": [
        {"hashtag": "USCreators", "post_count": 0, "rank": 1, "source": "curated"},
        {"hashtag": "AmericanContent", "post_count": 0, "rank": 2, "source": "curated"},
    ],
    "GB": [
        {"hashtag": "UKCreators", "post_count": 0, "rank": 1, "source": "curated"},
        {"hashtag": "LondonLife", "post_count": 0, "rank": 2, "source": "curated"},
    ],
    "IN": [
        {"hashtag": "IndiaCreators", "post_count": 0, "rank": 1, "source": "curated"},
        {"hashtag": "MumbaiLife", "post_count": 0, "rank": 2, "source": "curated"},
        {"hashtag": "BollywoodVibes", "post_count": 0, "rank": 3, "source": "curated"},
    ],
    "BR": [
        {"hashtag": "BrasilCreators", "post_count": 0, "rank": 1, "source": "curated"},
        {"hashtag": "SaoPauloLife", "post_count": 0, "rank": 2, "source": "curated"},
    ],
    "DE": [
        {"hashtag": "GermanyCreators", "post_count": 0, "rank": 1, "source": "curated"},
        {"hashtag": "BerlinLife", "post_count": 0, "rank": 2, "source": "curated"},
    ],
    "FR": [
        {"hashtag": "FranceCreators", "post_count": 0, "rank": 1, "source": "curated"},
        {"hashtag": "ParisLife", "post_count": 0, "rank": 2, "source": "curated"},
    ],
}


# ─── Main ─────────────────────────────────────────────────────────────────────

async def run():
    print(f"\n{'='*60}")
    print(f"CreatorPulse Trend Scraper — {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*60}\n")

    supabase = get_supabase()
    summary = []

    for region_code, config in REGIONS.items():
        print(f"\n[{region_code}] {config['label']}")

        # ── TikTok: scrape Creative Center ──
        tiktok_cc = await scrape_tiktok_creative_center(config["tiktok_cc"])

        # ── Google Trends: always run as supplement/fallback ──
        google = scrape_google_trends(config["google_geo"], region_code)

        # ── Merge TikTok + Google for TikTok platform cache ──
        tiktok_merged = merge_trends(tiktok_cc, google)
        tiktok_ok = push_to_supabase(supabase, region_code, "tiktok", tiktok_merged)

        # ── Instagram: use Google Trends + curated fallback ──
        ig_base = INSTAGRAM_FALLBACK.get(region_code, [])
        ig_merged = merge_trends(google, ig_base)
        ig_ok = push_to_supabase(supabase, region_code, "instagram", ig_merged)

        summary.append({
            "region": region_code,
            "tiktok_items": len(tiktok_merged),
            "instagram_items": len(ig_merged),
            "tiktok_ok": tiktok_ok,
            "ig_ok": ig_ok,
        })

    print(f"\n{'='*60}")
    print("Summary:")
    for s in summary:
        status = "✓" if s["tiktok_ok"] and s["ig_ok"] else "⚠"
        print(f"  {status} {s['region']}: TikTok={s['tiktok_items']} items, Instagram={s['instagram_items']} items")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    asyncio.run(run())
