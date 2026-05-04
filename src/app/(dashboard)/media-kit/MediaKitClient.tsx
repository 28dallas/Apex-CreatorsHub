"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Briefcase, Copy, Check, Loader2, Printer } from "lucide-react";
import { useTheme } from "@/components/auth/ThemeContext";

interface Account { platform: string; username: string; follower_count: number; }
interface RateCard { story: number; reel: number; dedicated: number; }

interface Props {
  user: { id: string; full_name?: string | null; username?: string | null; tier?: string | null };
  accounts: Account[];
  totalFollowers: number;
  existingKit: { niche: string; bio: string | null; rate_card: RateCard } | null;
  tier: string;
}

const NICHES = ["Comedy", "Fashion", "Food", "Tech", "Fitness", "Music", "Education", "Lifestyle", "Business", "Gaming", "Travel", "Beauty"];
const PLATFORM_ICONS: Record<string, string> = { tiktok: "🎵", instagram: "📸", twitter: "𝕏", youtube: "🎬" };

export default function MediaKitClient({ user, accounts, totalFollowers, existingKit, tier }: Props) {
  const { buttonTextColor } = useTheme();
  const [niche, setNiche] = useState(existingKit?.niche ?? "Lifestyle");
  const [bio, setBio] = useState(existingKit?.bio ?? "");
  const [rates, setRates] = useState<RateCard>(
    (existingKit?.rate_card as RateCard) ?? { story: 5000, reel: 15000, dedicated: 30000 }
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const supabase = createClient();

  if (tier === "starter") {
    return (
      <div className="p-6 rounded-2xl border text-center" style={{ backgroundColor: "rgba(var(--country-primary-rgb),0.14)", borderColor: "rgba(var(--country-secondary-rgb),0.22)" }}>
        <Briefcase className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--country-secondary)" }} />
        <p className="text-sm mb-3" style={{ color: "var(--country-secondary)" }}>🔒 Media Kit requires Growth Hacker plan</p>
        <a href="/billing" className="inline-block px-4 py-2 rounded-xl text-sm font-medium transition-colors" style={{ backgroundColor: "var(--country-primary)", color: buttonTextColor }}>
          Upgrade — KES 1,950/mo
        </a>
      </div>
    );
  }

  async function save() {
    setSaving(true);
    await supabase.from("media_kits").upsert({
      user_id: user.id,
      niche,
      bio,
      rate_card: rates,
      generated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setSaving(false);
  }

  function copyKit() {
    const text = `
📊 MEDIA KIT — ${user.full_name ?? user.username ?? "Creator"}
Niche: ${niche}
Total Followers: ${totalFollowers.toLocaleString()}

${accounts.map((a) => `${PLATFORM_ICONS[a.platform]} ${a.platform.charAt(0).toUpperCase() + a.platform.slice(1)}: @${a.username} (${a.follower_count.toLocaleString()} followers)`).join("\n")}

About: ${bio}

💰 RATE CARD
Story / Status: KES ${rates.story.toLocaleString()}
Reel / Short video: KES ${rates.reel.toLocaleString()}
Dedicated post: KES ${rates.dedicated.toLocaleString()}

Powered by CreatorPulse
    `.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-5">
      {/* Preview card */}
      <div id="media-kit-card" className="rounded-2xl border p-6 space-y-5" style={{ background: "linear-gradient(135deg, rgba(var(--country-primary-rgb),0.12), rgba(15,23,42,0.98) 45%, rgba(var(--country-secondary-rgb),0.14))", borderColor: "rgba(var(--country-secondary-rgb),0.24)" }}>
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl" style={{ backgroundColor: "rgba(var(--country-primary-rgb),0.26)" }}>
            {niche === "Fitness" ? "💪" : niche === "Food" ? "🍽️" : niche === "Comedy" ? "😂" : niche === "Fashion" ? "👗" : "✨"}
          </div>
          <div>
            <p className="font-bold text-lg">{user.full_name ?? `@${user.username}` ?? "Your Name"}</p>
            <p className="text-sm" style={{ color: "var(--country-secondary)" }}>{niche} Creator</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-2xl font-bold">{totalFollowers.toLocaleString()}</p>
            <p className="text-xs text-slate-400">Total Followers</p>
          </div>
        </div>

        {/* Platforms */}
        {accounts.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {accounts.map((a) => (
              <div key={a.platform} className="flex items-center gap-2 bg-slate-800/50 rounded-xl p-3">
                <span className="text-lg">{PLATFORM_ICONS[a.platform]}</span>
                <div>
                  <p className="text-xs font-medium">@{a.username}</p>
                  <p className="text-xs text-slate-400">{a.follower_count.toLocaleString()} followers</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bio */}
        {bio && <p className="text-sm text-slate-300 leading-relaxed">{bio}</p>}

        {/* Rate card */}
        <div>
          <p className="text-xs font-semibold text-slate-400 mb-2">💰 Rate Card</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Story", key: "story" as const },
              { label: "Reel", key: "reel" as const },
              { label: "Dedicated", key: "dedicated" as const },
            ].map(({ label, key }) => (
              <div key={key} className="bg-slate-800/50 rounded-xl p-3 text-center">
                <p className="text-xs text-slate-400 mb-1">{label}</p>
                <p className="font-bold text-sm">KES {rates[key].toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div className="bg-slate-900 rounded-2xl border p-4 space-y-4" style={{ borderColor: "rgba(var(--country-secondary-rgb),0.12)" }}>
        <p className="text-sm font-semibold">Customise</p>

        <div>
          <label className="text-xs text-slate-400 mb-1 block">Niche</label>
          <select value={niche} onChange={(e) => setNiche(e.target.value)}
            className="w-full bg-slate-800 border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
            style={{ borderColor: "rgba(var(--country-secondary-rgb),0.16)" }}>
            {NICHES.map((n) => <option key={n}>{n}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs text-slate-400 mb-1 block">Bio (1-2 sentences for brands)</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
            placeholder="e.g. Nairobi-based fitness creator helping young Kenyans build healthy habits on a budget."
            className="w-full bg-slate-800 border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none resize-none"
            style={{ borderColor: "rgba(var(--country-secondary-rgb),0.16)" }} />
        </div>

        <div>
          <label className="text-xs text-slate-400 mb-2 block">Rate Card (KES)</label>
          <div className="grid grid-cols-3 gap-2">
            {(["story", "reel", "dedicated"] as const).map((key) => (
              <div key={key}>
                <label className="text-xs text-slate-500 mb-1 block capitalize">{key}</label>
                <input type="number" value={rates[key]} onChange={(e) => setRates({ ...rates, [key]: Number(e.target.value) })}
                  className="w-full bg-slate-800 border rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  style={{ borderColor: "rgba(var(--country-secondary-rgb),0.16)" }} />
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={save} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 disabled:opacity-60 rounded-xl text-sm font-semibold transition-colors"
            style={{ backgroundColor: "var(--country-primary)", color: buttonTextColor }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {saved ? "Saved!" : "Save Kit"}
          </button>
          <button onClick={copyKit}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-medium transition-colors">
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            Copy
          </button>
          <button onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-medium transition-colors">
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
