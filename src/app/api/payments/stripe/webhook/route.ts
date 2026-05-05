import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/payments/stripe/stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createServiceClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      const tier = session.metadata?.tier as "growth" | "agency";

      if (userId && tier) {
        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        await Promise.all([
          supabase.from("subscriptions").insert({
            user_id: userId,
            tier,
            payment_provider: "stripe",
            provider_sub_id: session.subscription as string,
            amount_usd: (session.amount_total ?? 0) / 100,
            status: "active",
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
          }),
          supabase.from("users").update({
            tier,
            tier_expires_at: periodEnd.toISOString(),
          }).eq("id", userId),
        ]);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await supabase
        .from("subscriptions")
        .update({ status: "cancelled" })
        .eq("provider_sub_id", sub.id);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
