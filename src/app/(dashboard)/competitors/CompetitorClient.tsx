"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Users, Plus, Trash2, TrendingUp, TrendingDown, Loader2, BarChart2 } from "lucide-react";

interface Competitor {
  id: string;
  platform: string;
  handle: string;
  display_name: string | null;
  follower_count: number;
  last_checked_at: string | null;
  snapshots: Array<{ date: string; followers: number }>;
}

const PLATFORMS = ["tiktok", "instagram", "twitter", "youtube"] as const;

export default function CompetitorClient({
  competitors: initial,
  tier,
  userId,
}: {
  competitors: Competitor[];
  tier: string;
  userId: string;
}) {
  const [competitors, setCompetitors] = useState(initial);
  const [handle, setHandle] = useState("");
  const [platform, setPlatform] = useState<typeof PLATFORMS[number]>("tiktok");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  if (tier !== "agency") {
    return (
      <div className="p-6 rounded-2xl bg-orange-900/20 border border-orange-700/30 text-center">
        <BarChart2 className="w-8 h-8 text-orange-400 mx-auto mb-3" />
        <p className="text-sm text-orange-300 mb-3">🔒 Competitor Tracker requires Agency / Pro plan</p>
        <a href="/billing" className="inline-block px-4 py-2 bg-orange-600 hover:bg-orange-500 rounded-xl text-sm font-medium transition-colors">
          Upgrade — KES 5,850/mo
        </a>
      </div>
    );
  }

  async function addCompetitor(e: React.FormEvent) {
    e.preventDefault();
    if (!handle.trim()) return;
    setAdding(true);
    setError(null);

    const cleanHandle = handle.replace(/^@/, "").trim();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error: err } = await (supabase.from("competitor_tracks") as any)
      .insert({
        user_id: userId,
        platform,
        handle: cleanHandle,
        follower_count: 0,
        snapshots: [],
      })
      .select()
      .single();

    if (err) {
      setError(err.message.includes("unique") ? "Already tracking this account." : err.message);
    } else if (data) {
      setCompetitors((prev) => [data as Competitor, ...prev]);
      setHandle("");
    }
    setAdding(false);
  }

  async function remove(id: string) {
    await supabase.from("competitor_tracks").delete().eq("id", id);
    setCompetitors((prev) => prev.filter((c) => c.id !== id));
  }

  function getGrowthTrend(snapshots: Competitor["snapshots"]) {
    if (snapshots.length < 2) return null;
    const sorted = [...snapshots].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const diff = sorted[sorted.length - 1].followers - sorted[sorted.length - 2].followers;
    return diff;
  }

  const PLATFORM_ICONS: Record<string, string> = { tiktok: "🎵", instagram: "📸", twitter: "𝕏", youtube: "🎬" };

  return (
    <div className="space-y-5">
      {/* Add form */}
      <form onSubmit={addCompetitor} className="bg-slate-900 rounded-2xl border border-slate-800 p-4 space-y-3">
        <p className="text-sm font-semibold">Track a competitor</p>
        <div className="flex gap-2">
          <select value={platform} onChange={(e) => setPlatform(e.target.value as typeof PLATFORMS[number])}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500">
            {PLATFORMS.map((p) => <option key={p} value={p}>{PLATFORM_ICONS[p]} {p}</option>)}
          </select>
          <input type="text" placeholder="@handle" value={handle} onChange={(e) => setHandle(e.target.value)}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500" />
          <button type="submit" disabled={adding || !handle}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 rounded-xl text-sm font-medium transition-colors">
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add
          </button>
        </div>
        {error && <p className="text-red-400 text-xs">{error}</p>}
      </form>

      {/* Competitor list */}
      {competitors.length === 0 ? (
        <div className="text-center py-16 bg-slate-900 rounded-2xl border border-slate-800">
          <Users className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No competitors tracked yet. Add one above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {competitors.map((c) => {
            const trend = getGrowthTrend(c.snapshots);
            return (
              <div key={c.id} className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-lg">
                    {PLATFORM_ICONS[c.platform]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">@{c.handle}</p>
                    <p className="text-xs text-slate-500 capitalize">{c.platform}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{c.follower_count.toLocaleString()}</p>
                    {trend !== null && (
                      <div className={`flex items-center gap-1 text-xs justify-end ${trend >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {trend >= 0 ? "+" : ""}{trend.toLocaleString()}
                      </div>
                    )}
                  </div>
                  <button onClick={() => remove(c.id)}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors ml-2">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {c.last_checked_at && (
                  <p className="text-xs text-slate-600 mt-2 ml-13">
                    Last updated {new Date(c.last_checked_at).toLocaleDateString("en-KE")}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-slate-600 text-center">
        Competitor data is refreshed daily. Manual refresh coming soon.
      </p>
    </div>
  );
}
