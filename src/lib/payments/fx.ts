/**
 * Live FX Rate Utility
 *
 * Fetches KES/USD and NGN/USD rates from exchangerate-api.com (free tier: 1500 req/mo).
 * Caches in Supabase for 1 hour to avoid hitting rate limits.
 * Falls back to hardcoded conservative rates if fetch fails.
 *
 * Conservative fallbacks are set LOWER than actual rate (more KES/NGN per USD)
 * so we never under-charge the user during a currency dip.
 */

import { createServiceClient } from "@/lib/supabase/server";

// Conservative fallbacks — set higher than typical to protect margins
const FALLBACK_RATES: Record<string, number> = {
  KES: 135,   // KES per 1 USD (actual ~130, buffer for dips)
  NGN: 1650,  // NGN per 1 USD (actual ~1600, buffer for dips)
  ZAR: 19,
  GHS: 16,
  USD: 1,
  GBP: 0.79,
  EUR: 0.92,
};

const CACHE_TTL_MINUTES = 60;
const FX_API_BASE = "https://v6.exchangerate-api.com/v6";

export interface FXRate {
  currency: string;
  usd_to_local: number; // how many local units per 1 USD
  fetched_at: string;
  source: "live" | "cache" | "fallback";
}

/**
 * Get the current exchange rate for a currency against USD.
 * Checks Supabase cache first, fetches live if stale.
 */
export async function getFXRate(currency: string): Promise<FXRate> {
  const upper = currency.toUpperCase();

  if (upper === "USD") {
    return { currency: "USD", usd_to_local: 1, fetched_at: new Date().toISOString(), source: "live" };
  }

  const supabase = createServiceClient();

  // Check cache in trend_cache table (reuse existing infrastructure)
  // We store FX rates as a special "fx_rate" platform entry
  const { data: cached } = await supabase
    .from("trend_cache")
    .select("data, fetched_at")
    .eq("platform", "fx_rate")
    .eq("region", upper)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (cached?.data) {
    const rate = (cached.data as { usd_to_local: number }).usd_to_local;
    return { currency: upper, usd_to_local: rate, fetched_at: cached.fetched_at, source: "cache" };
  }

  // Fetch live rate
  const apiKey = process.env.EXCHANGERATE_API_KEY;
  if (!apiKey) {
    return { currency: upper, usd_to_local: FALLBACK_RATES[upper] ?? 1, fetched_at: new Date().toISOString(), source: "fallback" };
  }

  try {
    const res = await fetch(`${FX_API_BASE}/${apiKey}/pair/USD/${upper}`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) throw new Error(`FX API ${res.status}`);

    const json = await res.json();
    const rate: number = json.conversion_rate;

    if (!rate || typeof rate !== "number") throw new Error("Invalid rate");

    // Cache in Supabase
    const expires = new Date(Date.now() + CACHE_TTL_MINUTES * 60 * 1000).toISOString();
    await supabase.from("trend_cache").upsert({
      platform: "fx_rate",
      region: upper,
      trend_type: "topic",
      data: { usd_to_local: rate },
      expires_at: expires,
    });

    return { currency: upper, usd_to_local: rate, fetched_at: new Date().toISOString(), source: "live" };
  } catch (err) {
    console.warn(`[FX] Failed to fetch ${upper}/USD rate:`, err);
    return {
      currency: upper,
      usd_to_local: FALLBACK_RATES[upper] ?? 1,
      fetched_at: new Date().toISOString(),
      source: "fallback",
    };
  }
}

/**
 * Convert USD to local currency using live rate.
 * Applies a 3% buffer on top of the live rate to protect against
 * intra-day fluctuations between order creation and settlement.
 */
export async function usdToLocal(
  amountUsd: number,
  currency: string
): Promise<{ amount_local: number; rate: number; currency: string }> {
  const fx = await getFXRate(currency);
  const bufferedRate = fx.usd_to_local * 1.03; // 3% buffer
  const amountLocal = Math.ceil(amountUsd * bufferedRate);
  return { amount_local: amountLocal, rate: fx.usd_to_local, currency };
}

/**
 * Get the local currency for a region code.
 */
export function regionToCurrency(region: string): string {
  const map: Record<string, string> = {
    KE: "KES", NG: "NGN", ZA: "ZAR", GH: "GHS",
    TZ: "TZS", UG: "UGX", EG: "EGP",
    US: "USD", GB: "GBP", DE: "EUR", FR: "EUR",
    IN: "INR", BR: "BRL",
  };
  return map[region] ?? "USD";
}
