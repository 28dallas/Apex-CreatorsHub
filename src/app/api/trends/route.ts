import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get("region") ?? "KE";
  const platform = searchParams.get("platform") ?? "tiktok";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Tier gate — starter only gets US/GB
  const { data: profile } = await supabase
    .from("users")
    .select("tier")
    .eq("id", user.id)
    .single();

  const allowedRegions =
    profile?.tier === "starter" ? ["US", "GB"] : ["KE", "NG", "ZA", "US", "GB"];

  if (!allowedRegions.includes(region)) {
    return NextResponse.json(
      { error: "Upgrade to Growth Hacker to access this region.", upgrade: true },
      { status: 403 }
    );
  }

  const { data, error } = await supabase
    .from("trend_cache")
    .select("id, platform, region, trend_type, data, fetched_at, expires_at")
    .eq("region", region)
    .eq("platform", platform)
    .gt("expires_at", new Date().toISOString())
    .order("fetched_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return NextResponse.json({ trends: [], fetched_at: null });
  }

  return NextResponse.json({
    trends: data.data,
    fetched_at: data.fetched_at,
    expires_at: data.expires_at,
    region,
    platform,
  });
}
