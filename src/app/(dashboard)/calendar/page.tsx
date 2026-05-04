"use client";

import { useState } from "react";
import { generateWeeklyCalendar, type CalendarDay, type CalendarInput } from "@/lib/ai/content-tools";
import { CalendarDays, Loader2, RefreshCw, CheckCircle2, Clock, Hash } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/components/auth/ThemeContext";

const NICHES = ["Comedy", "Fashion", "Food", "Tech", "Fitness", "Music", "Education", "Lifestyle", "Business", "Gaming", "Travel", "Beauty"];
const PLATFORMS = ["tiktok", "instagram", "youtube"] as const;
const REGIONS = [
  { code: "KE", label: "🇰🇪 Kenya" },
  { code: "NG", label: "🇳🇬 Nigeria" },
  { code: "ZA", label: "🇿🇦 South Africa" },
  { code: "US", label: "🇺🇸 United States" },
  { code: "GB", label: "🇬🇧 United Kingdom" },
];

function getMonday(d = new Date()) {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split("T")[0];
}

export default function CalendarPage() {
  const { buttonTextColor } = useTheme();
  const [form, setForm] = useState<CalendarInput>({
    niche: "Comedy",
    region: "KE",
    platform: "tiktok",
    week_start: getMonday(),
  });
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    const result = await generateWeeklyCalendar(form);
    if (result.error) setError(result.error);
    else setDays(result.days);
    setLoading(false);
  }

  async function markPosted(date: string) {
    setMarkingId(date);
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("content_calendar") as any)
      .update({ status: "posted" })
      .eq("scheduled_date", date)
      .eq("platform", form.platform);
    setDays((prev) => prev.map((d) => d.date === date ? { ...d, status: "posted" } as CalendarDay & { status: string } : d));
    setMarkingId(null);
  }

  const weekLabel = (() => {
    const start = new Date(form.week_start);
    const end = new Date(form.week_start);
    end.setDate(end.getDate() + 6);
    return `${start.toLocaleDateString("en-KE", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-KE", { month: "short", day: "numeric", year: "numeric" })}`;
  })();

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-0">
      <div className="flex items-center gap-3">
        <CalendarDays className="w-6 h-6" style={{ color: "var(--country-secondary)" }} />
        <div>
          <h1 className="text-xl font-bold">Content Calendar</h1>
          <p className="text-xs text-slate-500">AI-generated weekly posting plan</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-slate-900 rounded-2xl border p-4 space-y-4" style={{ borderColor: "rgba(var(--country-secondary-rgb),0.12)" }}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Niche</label>
            <select
              value={form.niche}
              onChange={(e) => setForm({ ...form, niche: e.target.value })}
              className="w-full bg-slate-800 border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
              style={{ borderColor: "rgba(var(--country-secondary-rgb),0.16)" }}
            >
              {NICHES.map((n) => <option key={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Region</label>
            <select
              value={form.region}
              onChange={(e) => setForm({ ...form, region: e.target.value as CalendarInput["region"] })}
              className="w-full bg-slate-800 border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
              style={{ borderColor: "rgba(var(--country-secondary-rgb),0.16)" }}
            >
              {REGIONS.map(({ code, label }) => <option key={code} value={code}>{label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Platform</label>
            <select
              value={form.platform}
              onChange={(e) => setForm({ ...form, platform: e.target.value as CalendarInput["platform"] })}
              className="w-full bg-slate-800 border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
              style={{ borderColor: "rgba(var(--country-secondary-rgb),0.16)" }}
            >
              {PLATFORMS.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Week of</label>
            <input
              type="date"
              value={form.week_start}
              onChange={(e) => setForm({ ...form, week_start: e.target.value })}
              className="w-full bg-slate-800 border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
              style={{ borderColor: "rgba(var(--country-secondary-rgb),0.16)" }}
            />
          </div>
        </div>

        <button
          onClick={generate}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 disabled:opacity-60 rounded-xl font-semibold text-sm transition-colors"
          style={{ backgroundColor: "var(--country-primary)", color: buttonTextColor }}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {loading ? "Generating calendar..." : `Generate week of ${weekLabel}`}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-900/20 border border-red-700/30 text-red-400 text-sm">{error}</div>
      )}

      {/* Calendar grid */}
      {days.length > 0 && (
        <div className="space-y-3">
          {days.map((day) => (
            <div key={day.date} className="bg-slate-900 rounded-2xl border p-4" style={{ borderColor: "rgba(var(--country-secondary-rgb),0.12)" }}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-semibold text-sm">{day.day_label}</p>
                  <p className="text-xs text-slate-500">{new Date(day.date + "T00:00:00").toLocaleDateString("en-KE", { month: "short", day: "numeric" })}</p>
                </div>
                <div className="flex items-center gap-2">
                  {day.trend_used && (
                    <span className="px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: "rgba(var(--country-primary-rgb),0.18)", color: "var(--country-secondary)" }}>
                      🔥 {day.trend_used}
                    </span>
                  )}
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Clock className="w-3 h-3" />
                    {day.best_time}
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-400 mb-1 font-medium">{day.topic}</p>

              <div className="bg-slate-800/50 rounded-xl p-3 mb-3 space-y-2">
                <p className="text-sm font-semibold text-white">"{day.hook}"</p>
                <p className="text-xs text-slate-400">{day.caption}</p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {day.hashtags.slice(0, 4).map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded-full bg-slate-800 text-xs text-slate-400">
                      <Hash className="w-2.5 h-2.5 inline" />{tag}
                    </span>
                  ))}
                  {day.hashtags.length > 4 && (
                    <span className="text-xs text-slate-600">+{day.hashtags.length - 4}</span>
                  )}
                </div>
                <button
                  onClick={() => markPosted(day.date)}
                  disabled={markingId === day.date}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={{ backgroundColor: "rgba(var(--country-primary-rgb),0.16)", color: "var(--country-secondary)" }}
                >
                  {markingId === day.date
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <CheckCircle2 className="w-3 h-3" />}
                  Mark posted
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {days.length === 0 && !loading && (
        <div className="text-center py-16 bg-slate-900 rounded-2xl border" style={{ borderColor: "rgba(var(--country-secondary-rgb),0.12)" }}>
          <CalendarDays className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Generate your first weekly content plan above.</p>
        </div>
      )}
    </div>
  );
}
