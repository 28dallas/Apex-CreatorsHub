import { createClient } from "@/lib/supabase/server";
import { TrendingUp, Users, Zap, BarChart3, Plus } from "lucide-react";
import Link from "next/link";
import { getGrowthVelocity } from "@/lib/ai/content-tools";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: profile }, { data: accounts }, { data: recentOrders }, velocity] =
    await Promise.all([
      supabase.from("users").select("full_name, tier").eq("id", user!.id).single(),
      supabase.from("social_accounts").select("*").eq("user_id", user!.id),
      supabase
        .from("boost_orders")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(5),
      getGrowthVelocity(),
    ]);

  const totalFollowers = accounts?.reduce((sum, a) => sum + (a.follower_count ?? 0), 0) ?? 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 md:pb-0">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold">
          Hey {profile?.full_name?.split(" ")[0] ?? "Creator"} 👋
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Here&apos;s your growth overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Followers", value: totalFollowers.toLocaleString(), icon: Users, color: "text-purple-400" },
          { label: "Connected Accounts", value: accounts?.length ?? 0, icon: TrendingUp, color: "text-blue-400" },
          { label: "Boost Orders", value: recentOrders?.length ?? 0, icon: Zap, color: "text-orange-400" },
          {
            label: "Plan",
            value: profile?.tier === "agency" ? "Agency" : profile?.tier === "growth" ? "Growth" : "Starter",
            icon: BarChart3,
            color: "text-green-400",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
            <Icon className={`w-5 h-5 ${color} mb-2`} />
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Growth Velocity */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold">Growth Velocity</p>
          <span className="text-xs text-slate-500">This week</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 flex-shrink-0">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1e293b" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#9333ea" strokeWidth="3"
                strokeDasharray={`${velocity.score} ${100 - velocity.score}`}
                strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">{velocity.score}</span>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">{velocity.label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{velocity.insight}</p>
            {velocity.week_over_week !== 0 && (
              <p className={`text-xs mt-1 font-medium ${velocity.week_over_week >= 0 ? "text-green-400" : "text-red-400"}`}>
                {velocity.week_over_week >= 0 ? "+" : ""}{velocity.week_over_week}% vs last week
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Connected Accounts */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Connected Accounts</h2>
          <div className="flex gap-2">
            {(["tiktok", "instagram", "twitter", "youtube"] as const).map((p) => {
              const connected = accounts?.some((a) => a.platform === p);
              const href = p === "tiktok" ? "/api/auth/tiktok" : p === "instagram" ? "/api/auth/instagram" : "/login";
              return !connected ? (
                <a key={p} href={href}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors">
                  <Plus className="w-3 h-3" />
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </a>
              ) : null;
            })}
          </div>
        </div>

        {accounts && accounts.length > 0 ? (
          <div className="space-y-3">
            {accounts.map((account) => (
              <div key={account.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50">
                <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-sm">
                  {account.platform === "tiktok" ? "🎵" : account.platform === "instagram" ? "📸" : account.platform === "twitter" ? "𝕏" : "🎬"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">@{account.username}</p>
                  <p className="text-xs text-slate-500 capitalize">{account.platform}</p>
                </div>
                <p className="text-sm font-semibold text-slate-300">{account.follower_count.toLocaleString()}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-500 text-sm mb-3">No accounts connected yet</p>
            <a href="/api/auth/tiktok"
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-sm font-medium transition-colors">
              <Plus className="w-4 h-4" /> Connect TikTok
            </a>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: "/calendar", label: "Content Calendar", emoji: "📅" },
          { href: "/captions", label: "Write Caption", emoji: "✍️" },
          { href: "/hooks", label: "Hook Library", emoji: "🎣" },
          { href: "/scripts", label: "Script Writer", emoji: "🎬" },
          { href: "/trends", label: "View Trends", emoji: "🔥" },
          { href: "/ai-assistant", label: "Ask AI", emoji: "🤖" },
          { href: "/heatmap", label: "Best Times", emoji: "⏰" },
          { href: "/boost", label: "Boost Post", emoji: "🚀" },
        ].map(({ href, label, emoji }) => (
          <Link key={href} href={href}
            className="flex flex-col items-center gap-2 p-4 bg-slate-900 rounded-2xl border border-slate-800 hover:border-purple-500/50 transition-colors text-center">
            <span className="text-2xl">{emoji}</span>
            <span className="text-xs font-medium text-slate-300">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
