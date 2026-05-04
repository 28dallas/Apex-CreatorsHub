import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { initiateStkPush } from "@/lib/payments/daraja/stk-push";
import { z } from "zod";

const Schema = z.object({
  phone: z.string().regex(/^2547\d{8}$/, "Phone must be in format 2547XXXXXXXX"),
  tier: z.enum(["growth", "agency"]),
});

const PRICES: Record<string, number> = {
  growth: 1950,
  agency: 5850,
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { phone, tier } = parsed.data;
  const amount = PRICES[tier];

  const result = await initiateStkPush({
    phone,
    amount,
    accountRef: `CP-${user.id.slice(0, 8)}`,
    description: `CreatorPulse ${tier} plan`,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  // Record pending subscription
  const serviceClient = createServiceClient();
  await serviceClient.from("subscriptions").insert({
    user_id: user.id,
    tier,
    payment_provider: "mpesa",
    provider_sub_id: result.checkoutRequestId,
    amount_kes: amount,
    status: "trialing", // will be updated by callback
  });

  return NextResponse.json({
    success: true,
    checkoutRequestId: result.checkoutRequestId,
    message: "STK Push sent to your phone. Enter your M-Pesa PIN to complete.",
  });
}
