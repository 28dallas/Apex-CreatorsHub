"use client";

import { useState } from "react";
import { generateCaption, type CaptionInput, type CaptionOutput } from "@/lib/ai/content-tools";
import { PenLine, Loader2, Copy, Check } from "lucide-react";
import { useTheme } from "@/components/auth/ThemeContext";

const NICHES = ["Comedy", "Fashion", "Food", "Tech", "Fitness", "Music", "Education", "Lifestyle", "Business", "Gaming", "Travel", "Beauty"];
const REGIONS = [
  { code: "KE", label: "🇰🇪 Kenya" },
  { code: "NG", label: "🇳🇬 Nigeria" },
  { code: "ZA", label: "🇿🇦 South Africa" },
  { code: "US", label: "🇺🇸 United States" },
  { code: "GB", label: "🇬🇧 United Kingdom" },
];
const TONES = ["relatable", "funny", "inspirational", "educational"] as const;
const PLATFORMS = ["tiktok", "instagram", "twitter", "youtube"] as const;

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

export default function CaptionsPage() {
  const { buttonTextColor } = useTheme();
  const [form, setForm] = useState<CaptionInput>({
    niche: "Comedy",
    region: "KE",
    platform: "tiktok",
    trend: "",
    tone: "relatable",
  });
  const [result, setResult] = useState<CaptionOutput | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    const out = await generateCaption(form);
    setResult(out);
    setLoading(false);
  }

  const fullCaption = result
    ? `${result.hook}\n\n${result.caption}\n\n${result.cta}\n\n${result.hashtags.map((h) => `#${h}`).join(" ")}`
    : "";

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 md:pb-0">
      <div className="flex items-center gap-3">
        <PenLine className="w-6 h-6" style={{ color: "var(--country-secondary)" }} />
        <div>
          <h1 className="text-xl font-bold">Caption Generator</h1>
          <p className="text-xs text-slate-500">Full caption + hook + hashtags in one click</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Niche</label>
            <select value={form.niche} onChange={(e) => setForm({ ...form, niche: e.target.value })}
              className="w-full bg-slate-800 border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
              style={{ borderColor: "rgba(var(--country-secondary-rgb),0.16)" }}>
              {NICHES.map((n) => <option key={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Region</label>
            <select value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value as CaptionInput["region"] })}
              className="w-full bg-slate-800 border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
              style={{ borderColor: "rgba(var(--country-secondary-rgb),0.16)" }}>
              {REGIONS.map(({ code, label }) => <option key={code} value={code}>{label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Platform</label>
            <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value as CaptionInput["platform"] })}
              className="w-full bg-slate-800 border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
              style={{ borderColor: "rgba(var(--country-secondary-rgb),0.16)" }}>
              {PLATFORMS.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Tone</label>
            <select value={form.tone} onChange={(e) => setForm({ ...form, tone: e.target.value as CaptionInput["tone"] })}
              className="w-full bg-slate-800 border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
              style={{ borderColor: "rgba(var(--country-secondary-rgb),0.16)" }}>
              {TONES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-400 mb-1 block">Trend or Topic</label>
          <input
            type="text"
            placeholder="e.g. Tyla's Water sound, gym transformation, Nairobi street food..."
            value={form.trend}
            onChange={(e) => setForm({ ...form, trend: e.target.value })}
            required
            className="w-full bg-slate-800 border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
            style={{ borderColor: "rgba(var(--country-secondary-rgb),0.16)" }}
          />
        </div>

        <button type="submit" disabled={loading || !form.trend}
          className="w-full flex items-center justify-center gap-2 py-3 disabled:opacity-60 rounded-xl font-semibold text-sm transition-colors"
          style={{ backgroundColor: "var(--country-primary)", color: buttonTextColor }}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenLine className="w-4 h-4" />}
          {loading ? "Writing caption..." : "Generate Caption"}
        </button>
      </form>

      {result && !result.error && (
        <div className="space-y-3">
          {/* Hook */}
          <div className="bg-slate-900 rounded-2xl border p-4" style={{ borderColor: "rgba(var(--country-secondary-rgb),0.32)" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold" style={{ color: "var(--country-secondary)" }}>🎣 Hook (first line)</span>
              <CopyButton text={result.hook} />
            </div>
            <p className="text-sm font-semibold text-white">"{result.hook}"</p>
          </div>

          {/* Caption */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400">Caption</span>
              <CopyButton text={result.caption} />
            </div>
            <p className="text-sm text-slate-200 whitespace-pre-wrap">{result.caption}</p>
          </div>

          {/* CTA */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400">Call to Action</span>
              <CopyButton text={result.cta} />
            </div>
            <p className="text-sm text-slate-200">{result.cta}</p>
          </div>

          {/* Hashtags */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400">Hashtags</span>
              <CopyButton text={result.hashtags.map((h) => `#${h}`).join(" ")} />
            </div>
            <div className="flex flex-wrap gap-2">
              {result.hashtags.map((tag) => (
                <span key={tag} onClick={() => navigator.clipboard.writeText(`#${tag}`)}
                  className="px-2.5 py-1 rounded-full bg-slate-800 text-xs text-slate-300 cursor-pointer transition-colors"
                  style={{ border: "1px solid rgba(var(--country-secondary-rgb),0.14)" }}>
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Copy all */}
          <button onClick={() => navigator.clipboard.writeText(fullCaption)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-medium transition-colors">
            <Copy className="w-4 h-4" /> Copy full caption
          </button>
        </div>
      )}

      {result?.error && (
        <div className="p-4 rounded-2xl bg-red-900/20 border border-red-700/30 text-red-400 text-sm">{result.error}</div>
      )}
    </div>
  );
}
