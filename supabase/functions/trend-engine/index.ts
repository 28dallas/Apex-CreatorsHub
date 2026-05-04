// supabase/functions/trend-engine/index.ts
// This function is now a cache health check + manual fallback trigger.
// Real trend scraping is handled by the Python scraper (scraper/trend_scraper.py)
// which runs every 6 hours via GitHub Actions cron.
//
// Deploy: supabase functions deploy trend-engine
// This function can be called manually to check cache status or force a refresh signal.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const REGIONS = ["KE", "NG", "ZA", "US", "GB"] as const;
type Region = typeof REGIONS[number];

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  const now = new Date().toISOString();

  // Check cache status for all regions
  const cacheStatus: Record<string, { tiktok: boolean; instagram: boolean; age_minutes: number | null }> = {};

  for (const region of REGIONS) {
    const { data: tiktok } = await supabase
      .from("trend_cache")
      .select("fetched_at, expires_at")
      .eq("region", region)
      .eq("platform", "tiktok")
      .order("fetched_at", { ascending: false })
      .limit(1)
      .single();

    const { data: instagram } = await supabase
      .from("trend_cache")
      .select("fetched_at, expires_at")
      .eq("region", region)
      .eq("platform", "instagram")
      .order("fetched_at", { ascending: false })
      .limit(1)
      .single();

    const tiktokFresh = tiktok ? new Date(tiktok.expires_at) > new Date() : false;
    const igFresh = instagram ? new Date(instagram.expires_at) > new Date() : false;

    const ageMs = tiktok
      ? new Date().getTime() - new Date(tiktok.fetched_at).getTime()
      : null;

    cacheStatus[region] = {
      tiktok: tiktokFresh,
      instagram: igFresh,
      age_minutes: ageMs !== null ? Math.round(ageMs / 60000) : null,
    };
  }

  const staleRegions = Object.entries(cacheStatus)
    .filter(([, v]) => !v.tiktok || !v.instagram)
    .map(([k]) => k);

  return new Response(
    JSON.stringify({
      status: staleRegions.length === 0 ? "healthy" : "stale",
      stale_regions: staleRegions,
      cache: cacheStatus,
      checked_at: now,
      note: "Trends are populated by the Python scraper (GitHub Actions cron every 6h). Trigger manually: python scraper/trend_scraper.py",
    }),
    { headers: { "Content-Type": "application/json" } }
  );
});
