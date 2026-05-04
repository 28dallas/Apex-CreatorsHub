"use client";

import { useState } from "react";
import { generateScript, type ScriptInput, type ScriptOutput } from "@/lib/ai/content-tools";
import { FileText, Loader2, Copy, Check } from "lucide-react";
import { useTheme } from "@/components/auth/ThemeContext";

const NICHES = ["Comedy", "Fashion", "Food", "Tech", "Fitness", "Music", "Education", "Lifestyle", "Business", "Gaming", "Travel", "Beauty"];
const REGIONS = [
  { code: "KE", label: "🇰🇪 Kenya" },
  { code: "NG", label: "🇳🇬 Nigeria" },
  { code: "ZA", label: "🇿🇦 South Africa" },
  { code: "US", label: "🇺🇸 United States" },
  { code: "GB", label: "🇬🇧 United Kingdom" },
];

export default function ScriptsPage() {
  const { buttonTextColor } = useTheme();
  const [form, setForm] = useState<ScriptInput>({
    niche: "Comedy",
    region: "KE",
    topic: "",
    duration: "30s",
  });
  const [result, setResult] = useState<ScriptOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    const out = await generateScript(form);
    setResult(out);
    setLoading(false);
  }

  function copyScript() {
    if (!result) return;
    navigator.clipboard.writeText(`${result.title}\n\n${result.hook_line}\n\n${result.script}\n\nB-Roll: ${result.b_roll_notes}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 md:pb-0">
      <div className="flex items-center gap-3">
        <FileText className="w-6 h-6" style={{ color: "var(--country-secondary)" }} />
        <div>
          <h1 className="text-xl font-bold">Script Writer</h1>
          <p className="text-xs text-slate-500">30-second talking-head scripts for any topic</p>
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
            <select value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value as ScriptInput["region"] })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
              style={{ borderColor: "rgba(var(--country-secondary-rgb),0.16)" }}>
              {REGIONS.map(({ code, label }) => <option key={code} value={code}>{label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-400 mb-1 block">Video Duration</label>
          <div className="flex gap-2">
            {(["15s", "30s", "60s"] as const).map((d) => (
              <button key={d} type="button" onClick={() => setForm({ ...form, duration: d })}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  form.duration === d ? "text-white" : "bg-slate-800 text-slate-400 hover:text-white"
                }`}>
                <span
                  style={
                    form.duration === d
                      ? { backgroundColor: "var(--country-primary)", color: buttonTextColor, display: "block", borderRadius: "0.75rem", padding: "0.625rem 0" }
                      : undefined
                  }
                  className={form.duration === d ? "" : "block"}
                >
                {d}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-400 mb-1 block">Topic or Trend</label>
          <input type="text" placeholder="e.g. 3 things I wish I knew before starting a business in Nairobi"
            value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} required
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
            style={{ borderColor: "rgba(var(--country-secondary-rgb),0.16)" }} />
        </div>

        <button type="submit" disabled={loading || !form.topic}
          className="w-full flex items-center justify-center gap-2 py-3 disabled:opacity-60 rounded-xl font-semibold text-sm transition-colors"
          style={{ backgroundColor: "var(--country-primary)", color: buttonTextColor }}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          {loading ? "Writing script..." : "Generate Script"}
        </button>
      </form>

      {result && !result.error && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-sm text-slate-300">{result.title}</p>
            <button onClick={copyScript}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors">
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              Copy all
            </button>
          </div>

          <div className="rounded-2xl p-4 border" style={{ backgroundColor: "rgba(var(--country-primary-rgb),0.14)", borderColor: "rgba(var(--country-secondary-rgb),0.2)" }}>
            <p className="text-xs font-semibold mb-2" style={{ color: "var(--country-secondary)" }}>🎬 Opening hook (say this first)</p>
            <p className="text-sm font-semibold text-white">"{result.hook_line}"</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <p className="text-xs font-semibold text-slate-400 mb-3">Full Script</p>
            <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">{result.script}</p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
            <p className="text-xs font-semibold text-slate-400 mb-2">📹 B-Roll Notes</p>
            <p className="text-sm text-slate-400">{result.b_roll_notes}</p>
          </div>
        </div>
      )}

      {result?.error && (
        <div className="p-4 rounded-2xl bg-red-900/20 border border-red-700/30 text-red-400 text-sm">{result.error}</div>
      )}
    </div>
  );
}
