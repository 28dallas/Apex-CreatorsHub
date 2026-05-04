import { createClient } from "@/lib/supabase/server";
import { TrendingUp, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const REGIONS = [
  { code: "KE", label: "🇰🇪 Kenya" },
  { code: "NG", label: "🇳🇬 Nigeria" },
  { code: "ZA", label: "🇿🇦 South Africa" },
  { code: "US", label: "🇺🇸 United States" },
  { code: "GB", label: "🇬🇧 United Kingdom" },
];

export default async function TrendsPage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string; platform?: string }>;
}) {
  const params = await searchParams;
  const region = params.region ?? "KE";
  const platform = params.platform ?? "tiktok";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("users")
    .select("tier")
    .eq("id", user!.id)
    .single();

  // Starter tier: only US/GB. Growth+: all regions
  const allowedRegions =
    profile?.tier === "starter" ? ["US", "GB"] : ["KE", "NG", "ZA", "US", "GB"];

  const { data: trends } = await supabase
    .from("trend_cache")
    .select("*")
    .eq("region", region)
    .eq("platform", platform)
    .gt("expires_at", new Date().toISOString())
    .order("fetched_at", { ascending: false })
    .limit(1)
    .single();

  const trendItems = (trends?.data as Array<{ hashtag?: string; title?: string; post_count?: number }>) ?? [];

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 md:pb-0">
      <div className="flex items-center gap-3">
        <TrendingUp className="w-6 h-6 text-purple-400" />
        <div>
          <h1 className="text-xl font-bold">Trending Now</h1>
          {trends && (
            <p className="text-xs text-slate-500">
              Updated {formatDistanceToNow(new Date(trends.fetched_at))} ago
            </p>
          )}
        </div>
      </div>

      {/* Region selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {REGIONS.map(({ code, label }) => {
          const locked = !allowedRegions.includes(code);
          return (
            <a
              key={code}
              href={`/trends?region=${code}&platform=${platform}`}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                region === code
                  ? "bg-purple-600 text-white"
                  : locked
                  ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {label} {locked && "🔒"}
            </a>
          );
        })}
      </div>

      {/* Platform selector */}
      <div className="flex gap-2">
        {["tiktok", "instagram"].map((p) => (
          <a
            key={p}
            href={`/trends?region=${region}&platform=${p}`}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              platform === p
                ? "bg-purple-600 text-white"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            {p === "tiktok" ? "🎵 TikTok" : "📸 Instagram"}
          </a>
        ))}
      </div>

      {/* Trend list */}
      {trendItems.length > 0 ? (
        <div className="space-y-2">
          {trendItems.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-4 bg-slate-900 rounded-2xl border border-slate-800"
            >
              <span className="text-2xl font-bold text-slate-700 w-8 text-center">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.hashtag ?? item.title}</p>
                {item.post_count ? (
                  <p className="text-xs text-slate-500">
                    {item.post_count.toLocaleString()} posts
                  </p>
                ) : null}
              </div>
              <div className="flex items-center gap-1 text-green-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-900 rounded-2xl border border-slate-800">
          <RefreshCw className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">
            Trends are refreshed every 6 hours.
            <br />
            Check back soon or try a different region.
          </p>
        </div>
      )}

      {profile?.tier === "starter" && (
        <div className="p-4 rounded-2xl bg-purple-900/20 border border-purple-700/30 text-center">
          <p className="text-sm text-purple-300 mb-2">
            🔒 Unlock Kenya & Africa trends with Growth Hacker plan
          </p>
          <a
            href="/billing"
            className="inline-block px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-sm font-medium transition-colors"
          >
            Upgrade — KES 1,950/mo
          </a>
        </div>
      )}
    </div>
  );
}
