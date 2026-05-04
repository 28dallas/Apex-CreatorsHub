import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { fulfillBoostOrder } from "@/lib/smm/boost-action";

export async function POST(request: Request) {
  const body = await request.json();
  const callback = body?.Body?.stkCallback;

  if (!callback) {
    return NextResponse.json({ ResultCode: 1, ResultDesc: "Invalid payload" });
  }

  const { CheckoutRequestID, ResultCode } = callback;
  const supabase = createServiceClient();

  if (ResultCode === 0) {
    // ── Check if this is a subscription payment ──
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("id, tier, user_id")
      .eq("provider_sub_id", CheckoutRequestID)
      .single();

    if (sub) {
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      await Promise.all([
        supabase
          .from("subscriptions")
          .update({
            status: "active",
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
          })
          .eq("id", sub.id),
        supabase
          .from("users")
          .update({ tier: sub.tier, tier_expires_at: periodEnd.toISOString() })
          .eq("id", sub.user_id),
      ]);
    }

    // ── Check if this is a boost order payment ──
    // fulfillBoostOrder is a no-op if no matching unpaid order exists
    await fulfillBoostOrder(CheckoutRequestID);

  } else {
    // Payment failed or cancelled — cancel subscription if pending
    await supabase
      .from("subscriptions")
      .update({ status: "cancelled" })
      .eq("provider_sub_id", CheckoutRequestID)
      .eq("status", "trialing");

    // Mark boost order payment as failed
    await supabase
      .from("boost_orders")
      .update({ payment_status: "failed", status: "failed" })
      .eq("mpesa_checkout_id", CheckoutRequestID)
      .eq("payment_status", "unpaid");
  }

  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
}
