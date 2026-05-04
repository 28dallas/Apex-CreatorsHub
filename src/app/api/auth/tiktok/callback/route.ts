import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // user_id
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  if (!code || !state) {
    return NextResponse.redirect(`${appUrl}/dashboard?error=tiktok_auth_failed`);
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY!,
        client_secret: process.env.TIKTOK_CLIENT_SECRET!,
        code,
        grant_type: "authorization_code",
        redirect_uri: `${appUrl}/api/auth/tiktok/callback`,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error("No access token");

    // Fetch user info
    const userRes = await fetch(
      "https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,follower_count",
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
    );
    const userData = await userRes.json();
    const profile = userData.data?.user;

    const supabase = createServiceClient();

    // Store token in Supabase Vault (encrypted)
    const { data: secret } = await supabase.rpc("vault_create_secret", {
      secret: JSON.stringify({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
      }),
      name: `tiktok_${state}_${Date.now()}`,
      description: `TikTok OAuth token for user ${state}`,
    });

    // Upsert social account record
    await supabase.from("social_accounts").upsert({
      user_id: state,
      platform: "tiktok",
      platform_user_id: profile.open_id,
      username: profile.display_name,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
      follower_count: profile.follower_count ?? 0,
      vault_secret_id: secret,
      token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      scopes: tokenData.scope?.split(",") ?? [],
    }, { onConflict: "user_id,platform,platform_user_id" });

    return NextResponse.redirect(`${appUrl}/dashboard?connected=tiktok`);
  } catch (err) {
    console.error("TikTok OAuth error:", err);
    return NextResponse.redirect(`${appUrl}/dashboard?error=tiktok_auth_failed`);
  }
}
