"use client";

import { useState } from "react";
import { getAIGrowthPlan, logPlanResult, type AIInput, type AIOutput } from "@/lib/ai/growth-assistant";
import { Sparkles, Loader2, AlertTriangle, CheckCircle2, TrendingUp, Target, Info } from "lucide-react";
import { useTheme } from "@/components/auth/ThemeContext";

const NICHES = ["Comedy","Fashion","Food","Tech","Fitness","Music","Education","Lifestyle","Business","Gaming","Travel","Beauty","Finance","Parenting","Sports","News","DIY","Pets","Motivation","Relationships"];
const REGIONS = [
  // Full trend coverage
  { code: "KE", label: "🇰🇪 Kenya", coverage: "full" },
  { code: "NG", label: "🇳🇬 Nigeria", coverage: "full" },
  { code: "ZA", label: "🇿🇦 South Africa", coverage: "full" },
  { code: "GH", label: "🇬🇭 Ghana", coverage: "full" },
  { code: "TZ", label: "🇹🇿 Tanzania", coverage: "full" },
  { code: "UG", label: "🇺🇬 Uganda", coverage: "full" },
  // Beta — Google Trends only
  { code: "EG", label: "🇪🇬 Egypt (beta)", coverage: "beta" },
  { code: "US", label: "🇺🇸 United States (beta)", coverage: "beta" },
  { code: "GB", label: "🇬🇧 United Kingdom (beta)", coverage: "beta" },
  { code: "IN", label: "🇮🇳 India (beta)", coverage: "beta" },
  { code: "BR", label: "🇧🇷 Brazil (beta)", coverage: "beta" },
  { code: "DE", label: "🇩🇪 Germany (beta)", coverage: "beta" },
  { code: "FR", label: "🇫🇷 France (beta)", coverage: "beta" },
];
const LANGUAGES = [
  { code: "en", label: "English" }, { code: "sw", label: "Swahili" },
  { code: "fr", label: "Français" }, { code: "pt", label: "Português" },
  { code: "ar", label: "العربية" }, { code: "hi", label: "हिन्दी" },
  { code: "es", label: "Español" }, { code: "de", label: "Deutsch" },
  { code: "yo", label: "Yorùbá" }, { code: "ig", label: "Igbo" },
];
const FORMATS = ["Short video (< 30s)","Long video (> 60s)","Carousel","Reel","Live stream","Story","Text post"];
const PLATFORMS = ["tiktok","instagram","twitter","youtube","linkedin"] as const;

export default function AIAssistantPage() {
  const { buttonTextColor } = useTheme();
  const [form, setForm] = useState<AIInput>({
    niche: "Comedy", region: "KE", language: "en",
    engagement_rate: 3.5, peak_active_hours: "7pm-10pm",
    top_performing_format: "Short video (< 30s)",
    follower_count: 5000, last_7_day_growth: 120, platform: "tiktok",
  });
  const [result, setResult] = useState<AIOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ time: string; engagement: string } | null>(null);
  const [feedbackSent, setFeedbackSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setFeedback(null);
    setFeedbackSent(false);
    const output = await getAIGrowthPlan(form);
    setResult(output);
    setLoading(false);
  }

  async function submitFeedback() {
    if (!feedback) return;
    await logPlanResult({
      plan_date: new Date().toISOString().split("T")[0],
      actual_post_time: feedback.time,
      actual_engagement: parseFloat(feedback.engagement) || 0,
      platform: form.platform,
    });
    setFeedbackSent(true);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 md:pb-0">
      <div className="flex items-center gap-3">
        <Sparkles className="w-6 h-6" style={{ color: "var(--country-secondary)" }} />
        <div>
          <h1 className="text-xl font-bold">AI Growth Assistant</h1>
          <p className="text-xs text-slate-500">Powered by GPT-4o · Voice-aware · Multilingual</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Niche</label>
            <select value={form.niche} onChange={(e) => setForm({ ...form, niche: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
              style={{ borderColor: "rgba(var(--country-secondary-rgb),0.16)" }}>
              {NICHES.map((n) => <option key={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Region</label>
            <select value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
              style={{ borderColor: "rgba(var(--country-secondary-rgb),0.16)" }}>
              {REGIONS.map(({ code, label }) => <option key={code} value={code}>{label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Platform</label>
            <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
              style={{ borderColor: "rgba(var(--country-secondary-rgb),0.16)" }}>
              {PLATFORMS.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Response Language</label>
            <select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
              style={{ borderColor: "rgba(var(--country-secondary-rgb),0.16)" }}>
              {LANGUAGES.map(({ code, label }) => <option key={code} value={code}>{label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Follower Count</label>
            <input type="number" value={form.follower_count}
              onChange={(e) => setForm({ ...form, follower_count: Number(e.target.value) })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
              style={{ borderColor: "rgba(var(--country-secondary-rgb),0.16)" }} />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Engagement Rate (%)</label>
            <input type="number" step="0.1" value={form.engagement_rate}
              onChange={(e) => setForm({ ...form, engagement_rate: Number(e.target.value) })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
              style={{ borderColor: "rgba(var(--country-secondary-rgb),0.16)" }} />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">7-Day Follower Growth</label>
            <input type="number" value={form.last_7_day_growth}
              onChange={(e) => setForm({ ...form, last_7_day_growth: Number(e.target.value) })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
              style={{ borderColor: "rgba(var(--country-secondary-rgb),0.16)" }} />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Peak Active Hours</label>
            <input type="text" value={form.peak_active_hours} placeholder="e.g. 7pm-10pm"
              onChange={(e) => setForm({ ...form, peak_active_hours: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
              style={{ borderColor: "rgba(var(--country-secondary-rgb),0.16)" }} />
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-400 mb-1 block">Top Performing Format</label>
          <select value={form.top_performing_format}
            onChange={(e) => setForm({ ...form, top_performing_format: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
            style={{ borderColor: "rgba(var(--country-secondary-rgb),0.16)" }}>
            {FORMATS.map((f) => <option key={f}>{f}</option>)}
          </select>
        </div>

        <button type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 disabled:opacity-60 rounded-xl font-semibold transition-colors"
          style={{ backgroundColor: "var(--country-primary)", color: buttonTextColor }}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? "Generating plan..." : "Generate Growth Plan"}
        </button>
      </form>

      {result && !result.error && (
        <div className="space-y-3">
          {/* Daily Action */}
          <div className="p-4 rounded-2xl border" style={{ backgroundColor: "rgba(var(--country-primary-rgb),0.14)", borderColor: "rgba(var(--country-secondary-rgb),0.24)" }}>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4" style={{ color: "var(--country-secondary)" }} />
              <span className="text-sm font-semibold" style={{ color: "var(--country-secondary)" }}>Today&apos;s Action</span>
              <span className="ml-auto text-xs text-slate-500">{Math.round(result.confidence_score * 100)}% confidence</span>
            </div>
            <p className="text-sm text-slate-200">{result.daily_action}</p>
            {result.voice_note && (
              <p className="text-xs mt-2 italic" style={{ color: "rgba(var(--country-secondary-rgb),0.8)" }}>{result.voice_note}</p>
            )}
          </div>

          {/* Predicted Engagement */}
          {result.predicted_engagement_range && (
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold text-blue-300">Predicted Engagement</span>
                {!result.engagement_data_backed && (
                  <span className="ml-auto flex items-center gap-1 text-xs text-slate-500">
                    <Info className="w-3 h-3" /> baseline estimate
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-300">{result.predicted_engagement_range}</p>
              {!result.engagement_data_backed && (
                <p className="text-xs text-slate-600 mt-1">Log your results below to unlock your personal prediction.</p>
              )}
            </div>
          )}

          {/* Trend coverage notice for beta regions */}
          {result.trend_coverage === "beta" && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-800/50 border border-slate-700">
              <Info className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-500">Trend data for this region is in beta — we&apos;re expanding coverage. Plans use Google Trends + niche intelligence.</p>
            </div>
          )}

          {/* Growth Warning */}
          {result.growth_warning && (
            <div className="p-4 rounded-2xl bg-orange-900/20 border border-orange-700/30">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-semibold text-orange-300">Growth Warning</span>
              </div>
              <p className="text-sm text-slate-300">{result.growth_warning}</p>
            </div>
          )}

          {/* Hashtags */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <p className="text-sm font-semibold mb-3">Recommended Hashtags</p>
            <div className="flex flex-wrap gap-2">
              {result.hashtags.map((tag) => (
                <span key={tag} onClick={() => navigator.clipboard.writeText(`#${tag}`)}
                  className="px-2.5 py-1 rounded-full bg-slate-800 text-xs text-slate-300 cursor-pointer transition-colors"
                  style={{ border: "1px solid rgba(var(--country-secondary-rgb),0.12)" }}>
                  #{tag}
                </span>
              ))}
            </div>
            <p className="text-xs text-slate-600 mt-2">Tap to copy</p>
          </div>

          {/* Plan vs Actual feedback */}
          {!feedbackSent ? (
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-sm font-semibold">Close the loop — did you follow this plan?</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">When did you post?</label>
                  <input type="text" placeholder="e.g. 7:30 PM" value={feedback?.time ?? ""}
                    onChange={(e) => setFeedback((f) => ({ time: e.target.value, engagement: f?.engagement ?? "" }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Actual engagement rate (%)</label>
                  <input type="number" step="0.1" placeholder="e.g. 5.2" value={feedback?.engagement ?? ""}
                    onChange={(e) => setFeedback((f) => ({ time: f?.time ?? "", engagement: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500" />
                </div>
              </div>
              <button onClick={submitFeedback} disabled={!feedback?.time || !feedback?.engagement}
                className="w-full py-2.5 border rounded-xl text-sm font-medium transition-colors disabled:opacity-40"
                style={{ backgroundColor: "rgba(var(--country-primary-rgb),0.14)", borderColor: "rgba(var(--country-secondary-rgb),0.24)", color: "var(--country-secondary)" }}>
                Log result
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-green-900/20 border border-green-700/30 text-center">
              <CheckCircle2 className="w-5 h-5 text-green-400 mx-auto mb-1" />
              <p className="text-sm text-green-300">Result logged. Your AI plans will get more accurate over time.</p>
            </div>
          )}
        </div>
      )}

      {result?.error && (
        <div className="p-4 rounded-2xl bg-red-900/20 border border-red-700/30 text-red-400 text-sm">{result.error}</div>
      )}
    </div>
  );
}
