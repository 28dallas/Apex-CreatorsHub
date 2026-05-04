import { createClient } from "@/lib/supabase/server";
import { BarChart3 } from "lucide-react";
import PostHeatmap, { type HeatmapCell } from "@/components/heatmap/PostHeatmap";

function computeGoldenWindows(cells: HeatmapCell[], topN = 3) {
  return [...cells]
    .filter((c) => c.engagement > 0)
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, topN)
    .map(({ day, hour }) => ({ day, hour }));
}

export default async function HeatmapPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: analytics } = await supabase
    .from("post_analytics")
    .select("day_of_week, hour_of_day, engagement_rate, likes, views")
    .eq("user_id", user!.id)
    .order("posted_at", { ascending: false })
    .limit(500);

  // Aggregate by day+hour
  const aggregated = new Map<string, { total: number; count: number; posts: number }>();

  for (const row of analytics ?? []) {
    const key = `${row.day_of_week}-${row.hour_of_day}`;
    const existing = aggregated.get(key) ?? { total: 0, count: 0, posts: 0 };
    aggregated.set(key, {
      total: existing.total + (row.engagement_rate ?? 0) * 100,
      count: existing.count + 1,
      posts: existing.posts + 1,
    });
  }

  // Normalize to 0-100
  const rawCells: HeatmapCell[] = Array.from(aggregated.entries()).map(([key, val]) => {
    const [day, hour] = key.split("-").map(Number);
    return { day, hour, engagement: val.total / val.count, post_count: val.posts };
  });

  const maxEngagement = Math.max(...rawCells.map((c) => c.engagement), 1);
  const cells: HeatmapCell[] = rawCells.map((c) => ({
    ...c,
    engagement: (c.engagement / maxEngagement) * 100,
  }));

  const goldenWindows = computeGoldenWindows(cells);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-0">
      <div className="flex items-center gap-3">
        <BarChart3 className="w-6 h-6 text-purple-400" />
        <div>
          <h1 className="text-xl font-bold">Best Time to Post</h1>
          <p className="text-xs text-slate-500">Based on your post performance history</p>
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 md:p-6">
        {cells.length > 0 ? (
          <PostHeatmap data={cells} goldenWindows={goldenWindows} />
        ) : (
          <div className="text-center py-16">
            <BarChart3 className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">
              No post data yet. Connect your accounts and sync your posts to see your heatmap.
            </p>
          </div>
        )}
      </div>

      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <p className="text-sm font-semibold mb-2">How to read this</p>
        <ul className="text-xs text-slate-400 space-y-1">
          <li>• Each cell = one hour of one day of the week</li>
          <li>• Darker purple = higher average engagement on posts made at that time</li>
          <li>• 🏆 Orange cells = your top 3 golden windows — post here for maximum reach</li>
        </ul>
      </div>
    </div>
  );
}
