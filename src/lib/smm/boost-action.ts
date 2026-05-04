"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { initiateStkPush } from "@/lib/payments/daraja/stk-push";
import { routeOrder, getBestPrice, checkSmmwizBalance } from "@/lib/smm/providers";
import { usdToLocal, regionToCurrency } from "@/lib/payments/fx";
import { z } from "zod";
import crypto from "crypto";

const MARKUP = 1.4;          // 40% margin on SMM cost
const COOLDOWN_HOURS = 48;

const TIER_LIMITS: Record<string, number> = {
  new: 500,
  growing: 2000,
  established: 10000,
};

// Drip-feed config: deliver in 10 batches over 20 hours (120 min intervals)
const DRIP_INTERVAL_MINUTES = 120;

const BoostSchema = z.object({
  social_account_id: z.string().uuid(),
  post_url: z.string().url(),
  service_type: z.enum(["likes", "views", "followers", "comments"]),
  quantity: z.number().int().min(10).max(10000),
  phone: z.string().regex(/^2547\d{8}$/, "Phone must be 2547XXXXXXXX"),
});

export type BoostInput = z.infer<typeof BoostSchema>;

export interface BoostResult {
  success: boolean;
  order_id?: string;
  user_pays_local?: number;
  currency?: string;
  message?: string;
  error?: string;
}

function getSafetyTier(accountAgeDays: number, followerCount: number): string {
  if (accountAgeDays < 30) return "new";
  if (accountAgeDays <= 90) return "growing";
  if (followerCount >= 10000) return "established";
  return "growing";
}

export async function createBoostOrder(input: BoostInput): Promise<BoostResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("users")
    .select("tier")
    .eq("id", user.id)
    .single();

  if (profile?.tier !== "agency") {
    return { success: false, error: "SMM Booster requires Agency/Pro plan." };
  }

  const parsed = BoostSchema.parse(input);

  const { data: account } = await supabase
    .from("social_accounts")
    .select("account_age_days, follower_count, platform")
    .eq("id", parsed.social_account_id)
    .eq("user_id", user.id)
    .single();

  if (!account) return { success: false, error: "Social account not found." };

  const safetyTier = getSafetyTier(account.account_age_days, account.follower_count);
  const maxQuantity = TIER_LIMITS[safetyTier];

  if (parsed.quantity > maxQuantity) {
    return {
      success: false,
      error: `Safety limit: Your account tier (${safetyTier}) allows max ${maxQuantity.toLocaleString()} per order.`,
    };
  }

  // 48h cooldown check
  const postIdentifier = crypto
    .createHash("sha256")
    .update(parsed.post_url)
    .digest("hex")
    .slice(0, 16);

  const cooldownCutoff = new Date(Date.now() - COOLDOWN_HOURS * 60 * 60 * 1000).toISOString();
  const { data: recentOrder } = await supabase
    .from("boost_orders")
    .select("id, created_at")
    .eq("user_id", user.id)
    .eq("post_identifier", postIdentifier)
    .eq("payment_status", "paid")
    .gt("created_at", cooldownCutoff)
    .limit(1)
    .single();

  if (recentOrder) {
    const nextAvailable = new Date(
      new Date(recentOrder.created_at).getTime() + COOLDOWN_HOURS * 60 * 60 * 1000
    );
    return {
      success: false,
      error: `Cooldown active. Next boost available: ${nextAvailable.toLocaleString("en-KE")}.`,
    };
  }

  // Get best price from primary provider for this region
  // We don't know the user's region here — default to KE (M-Pesa implies Kenya)
  const region = "KE";
  const { cost_usd: smmCostUsd, provider: primaryProvider } = await getBestPrice(
    parsed.service_type,
    account.platform,
    region,
    parsed.quantity
  );

  const userPaysUsd = parseFloat((smmCostUsd * MARKUP).toFixed(4));

  // Live FX conversion with 3% buffer
  const currency = regionToCurrency(region);
  const { amount_local: userPaysLocal, rate: fxRate } = await usdToLocal(userPaysUsd, currency);

  const serviceClient = createServiceClient();

  // Create order as UNPAID — SMM panel NOT called yet
  const { data: order, error: orderError } = await serviceClient
    .from("boost_orders")
    .insert({
      user_id: user.id,
      social_account_id: parsed.social_account_id,
      platform: account.platform,
      post_url: parsed.post_url,
      service_type: parsed.service_type,
      quantity: parsed.quantity,
      smm_cost_usd: smmCostUsd,
      user_pays_usd: userPaysUsd,
      safety_tier: safetyTier,
      post_identifier: postIdentifier,
      status: "pending",
      payment_status: "unpaid",
      provider_used: primaryProvider,
      drip_feed: true,
      fx_rate_at_order: fxRate,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return { success: false, error: "Failed to create order. Please try again." };
  }

  // Trigger M-Pesa STK Push
  const stkResult = await initiateStkPush({
    phone: parsed.phone,
    amount: userPaysLocal,
    accountRef: `BOOST-${order.id.slice(0, 8)}`,
    description: `CreatorPulse boost: ${parsed.quantity} ${parsed.service_type}`,
  });

  if (!stkResult.success) {
    await serviceClient.from("boost_orders").delete().eq("id", order.id);
    return { success: false, error: `M-Pesa error: ${stkResult.error}` };
  }

  await serviceClient
    .from("boost_orders")
    .update({ mpesa_checkout_id: stkResult.checkoutRequestId })
    .eq("id", order.id);

  return {
    success: true,
    order_id: order.id,
    user_pays_local: userPaysLocal,
    currency,
    message: `STK Push sent to ${parsed.phone}. Enter your M-Pesa PIN to confirm ${currency} ${userPaysLocal.toLocaleString()}.`,
  };
}

/**
 * Called from M-Pesa callback after ResultCode: 0.
 * Routes order through SMM providers with automatic failover.
 * Drip-feed is ON by default — delivers gradually over 20 hours.
 */
export async function fulfillBoostOrder(checkoutRequestId: string): Promise<void> {
  const supabase = createServiceClient();

  const { data: order } = await supabase
    .from("boost_orders")
    .select("id, post_url, service_type, quantity, platform, provider_used")
    .eq("mpesa_checkout_id", checkoutRequestId)
    .eq("payment_status", "unpaid")
    .single();

  if (!order) return;

  // Mark paid immediately — prevents double-fulfillment on duplicate callbacks
  await supabase
    .from("boost_orders")
    .update({ payment_status: "paid", status: "processing" })
    .eq("id", order.id);

  // Pre-flight: warn if Smmwiz balance is low (non-blocking — still attempt the order)
  await checkSmmwizBalance();

  // Route through smart router with drip-feed and failover
  const result = await routeOrder(
    {
      service_type: order.service_type as "likes" | "views" | "followers" | "comments",
      platform: order.platform,
      post_url: order.post_url,
      quantity: order.quantity,
      drip_feed: true,
      drip_interval_minutes: DRIP_INTERVAL_MINUTES,
    },
    "KE" // region for provider selection
  );

  if (result.success) {
    await supabase
      .from("boost_orders")
      .update({
        exobooster_order_id: result.external_order_id,
        provider_used: result.provider,
        status: "processing",
      })
      .eq("id", order.id);
  } else {
    // All providers failed — mark failed but payment is confirmed
    // Manual retry possible via admin dashboard
    await supabase
      .from("boost_orders")
      .update({
        status: "failed",
        provider_used: result.provider,
      })
      .eq("id", order.id);

    console.error(
      `[Boost] All providers failed for order ${order.id} after ${result.attempts} attempts: ${result.error}`
    );
  }
}
