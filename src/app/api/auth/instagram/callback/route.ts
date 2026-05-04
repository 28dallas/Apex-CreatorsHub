import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // user_id
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  if (!code || !state) {
    return NextResponse.redirect(`${appUrl}/dashboard?error=instagram_auth_failed`);
  }

  try {
    // Exchange code for short-lived token
    const form = new FormData();
    form.append("client_id", process.env.INSTAGRAM_CLIENT_ID!);
    form.append("client_secret", process.env.INSTAGRAM_CLIENT_SECRET!);
    form.append("grant_type", "authorization_code");
    form.append("redirect_uri", `${appUrl}/api/auth/instagram/callback`);
    form.append("code", code);

    const tokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      body: form,
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error("No access token");

    // Exchange for long-lived token
    const longLivedRes = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${process.env.INSTAGRAM_CLIENT_SECRET}&access_token=${tokenData.access_token}`
    );
    const longLivedData = await longLivedRes.json();

    // Fetch user profile
    const profileRes = await fetch(
      `https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${longLivedData.access_token}`
    );
    const profile = await profileRes.json();

    const supabase = createServiceClient();

    // Store in Vault
    const { data: secret } = await supabase.rpc("vault_create_secret", {
      secret: JSON.stringify({ access_token: longLivedData.access_token }),
      name: `instagram_${state}_${Date.now()}`,
      description: `Instagram OAuth token for user ${state}`,
    });

    await supabase.from("social_accounts").upsert({
      user_id: state,
      platform: "instagram",
      platform_user_id: profile.id,
      username: profile.username,
      display_name: profile.username,
      vault_secret_id: secret,
      token_expires_at: new Date(Date.now() + longLivedData.expires_in * 1000).toISOString(),
      scopes: ["instagram_basic", "instagram_content_publish", "instagram_manage_insights", "read_insights"],
    }, { onConflict: "user_id,platform,platform_user_id" });

    return NextResponse.redirect(`${appUrl}/dashboard?connected=instagram`);
  } catch (err) {
    console.error("Instagram OAuth error:", err);
    return NextResponse.redirect(`${appUrl}/dashboard?error=instagram_auth_failed`);
  }
}
