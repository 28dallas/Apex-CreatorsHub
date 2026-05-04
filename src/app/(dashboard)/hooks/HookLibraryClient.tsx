"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { useTheme } from "@/components/auth/ThemeContext";

interface Hook {
  id: string;
  niche: string;
  region: string;
  hook: string;
  format: string;
  saves: number;
}

const NICHES = ["All", "Comedy", "Fashion", "Food", "Tech", "Fitness", "Music", "Education", "Lifestyle", "Business", "Gaming", "Travel", "Beauty"];

function HookCard({ hook }: { hook: Hook }) {
  const { buttonTextColor: _ } = useTheme();
  const [copied, setCopied] = useState(false);

  return (
    <div
      className="bg-slate-900 rounded-2xl border p-4 transition-colors"
      style={{ borderColor: "rgba(var(--country-secondary-rgb),0.12)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-white leading-relaxed flex-1">"{hook.hook}"</p>
        <button
          onClick={() => { navigator.clipboard.writeText(hook.hook); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className="flex-shrink-0 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
        </button>
      </div>
      <div className="flex items-center gap-2 mt-3">
        <span
          className="px-2 py-0.5 rounded-full text-xs"
          style={{ backgroundColor: "rgba(var(--country-primary-rgb),0.18)", color: "var(--country-secondary)" }}
        >
          {hook.niche}
        </span>
        {hook.region !== "ALL" && (
          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-xs">{hook.region}</span>
        )}
        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-500 text-xs">{hook.format.replace("_", " ")}</span>
      </div>
    </div>
  );
}

export default function HookLibraryClient({ hooks, tier }: { hooks: Hook[]; tier: string }) {
  const { buttonTextColor } = useTheme();
  const [selectedNiche, setSelectedNiche] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = hooks.filter((h) => {
    const matchNiche = selectedNiche === "All" || h.niche === selectedNiche;
    const matchSearch = !search || h.hook.toLowerCase().includes(search.toLowerCase());
    return matchNiche && matchSearch;
  });

  if (tier === "starter") {
    return (
      <div
        className="p-6 rounded-2xl border text-center"
        style={{ backgroundColor: "rgba(var(--country-primary-rgb),0.14)", borderColor: "rgba(var(--country-secondary-rgb),0.22)" }}
      >
        <p className="text-sm mb-3" style={{ color: "var(--country-secondary)" }}>🔒 Hook Library requires Growth Hacker plan</p>
        <a href="/billing" className="inline-block px-4 py-2 rounded-xl text-sm font-medium transition-colors" style={{ backgroundColor: "var(--country-primary)", color: buttonTextColor }}>
          Upgrade — KES 1,950/mo
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <input
        type="text"
        placeholder="Search hooks..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none"
        style={{ borderColor: "rgba(var(--country-secondary-rgb),0.16)" }}
      />

      {/* Niche filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {NICHES.map((n) => (
          <button
            key={n}
            onClick={() => setSelectedNiche(n)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedNiche === n ? "text-white" : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
            style={
              selectedNiche === n
                ? { backgroundColor: "var(--country-primary)", color: buttonTextColor }
                : undefined
            }
          >
            {n}
          </button>
        ))}
      </div>

      <p className="text-xs text-slate-500">{filtered.length} hooks</p>

      <div className="space-y-3">
        {filtered.map((hook) => <HookCard key={hook.id} hook={hook} />)}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-slate-500 text-sm">No hooks found for this filter.</div>
      )}
    </div>
  );
}
