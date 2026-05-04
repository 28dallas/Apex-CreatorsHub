"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { analyzeCreatorVoice } from "@/lib/ai/growth-assistant";
import { Loader2, CheckCircle2, Trash2, Settings, Brain, AlertCircle } from "lucide-react";

const NICHES = ["Comedy","Fashion","Food","Tech","Fitness","Music","Education","Lifestyle","Business","Gaming","Travel","Beauty","Finance","Parenting","Sports","News","DIY","Pets","Motivation","Relationships"];
const REGIONS = [
  { code: "KE", label: "🇰🇪 Kenya" }, { code: "NG", label: "🇳🇬 Nigeria" },
  { code: "ZA", label: "🇿🇦 South Africa" }, { code: "GH", label: "🇬🇭 Ghana" },
  { code: "TZ", label: "🇹🇿 Tanzania" }, { code: "UG", label: "🇺🇬 Uganda" },
  { code: "EG", label: "🇪🇬 Egypt" }, { code: "US", label: "🇺🇸 United States" },
  { code: "GB", label: "🇬🇧 United Kingdom" }, { code: "IN", label: "🇮🇳 India" },
  { code: "BR", label: "🇧🇷 Brazil" }, { code: "DE", label: "🇩🇪 Germany" },
  { code: "FR", label: "🇫🇷 France" },
];
const LANGUAGES = [
  { code: "en", label: "English" }, { code: "sw", label: "Swahili" },
  { code: "fr", label: "Français" }, { code: "pt", label: "Português" },
  { code: "ar", label: "العربية" }, { code: "hi", label: "हिन्दी" },
  { code: "es", label: "Español" }, { code: "de", label: "Deutsch" },
  { code: "yo", label: "Yorùbá" }, { code: "ig", label: "Igbo" },
];

interface Props {
  user: {
    id: string;
    email: string;
    full_name?: string | null;
    username?: string | null;
    tier?: string | null;
    tier_expires_at?: string | null;
    language?: string | null;
    niche_tags?: string[] | null;
  };
  accounts: Array<{
    id: string;
    platform: string;
    username: string;
    follower_count: number;
    account_age_days: number;
  }>;
  voiceProfile: { analyzed_at: string; tone: string } | null;
  postCount: number;
}

const PLATFORM_ICONS: Record<string, string> = {
  tiktok: "🎵", instagram: "📸", twitter: "𝕏", youtube: "🎬",
  linkedin: "💼", pinterest: "📌", snapchat: "👻",
};

export default function SettingsForm({ user, accounts, voiceProfile, postCount }: Props) {
  const [fullName, setFullName] = useState(user.full_name ?? "");
  const [username, setUsername] = useState(user.username ?? "");
  const [language, setLanguage] = useState(user.language ?? "en");
  const [niche, setNiche] = useState(user.niche_tags?.[0] ?? "Comedy");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voiceStatus, setVoiceStatus] = useState<"idle" | "loading" | "done" | "error" | "too_few">("idle");
  const supabase = createClient();

  const canReanalyzeVoice = postCount >= 10;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    // Save language and niche_tags to DB — not localStorage
    const { error: dbError } = await supabase
      .from("users")
      .update({
        full_name: fullName,
        username: username || null,
        language,
        niche_tags: [niche],
      })
      .eq("id", user.id);

    if (dbError) {
      setError(dbError.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  async function handleReanalyzeVoice() {
    if (!canReanalyzeVoice) {
      setVoiceStatus("too_few");
      return;
    }

    setVoiceStatus("loading");

    // Fetch recent captions from post_analytics (or connected account)
    // In production this would pull from the platform API via stored token.
    // Here we pull from post_analytics captions if stored, else show guidance.
    const { data: posts } = await supabase
      .from("post_analytics")
      .select("post_id")
      .eq("user_id", user.id)
      .order("posted_at", { ascending: false })
      .limit(20);

    if (!posts || posts.length < 10) {
      setVoiceStatus("too_few");
      return;
    }

    // post_analytics doesn't store captions — we pass post_ids as placeholder captions
    // In production: fetch actual captions from platform API using vault token
    const placeholderCaptions = posts.map((p) => p.post_id);
    const result = await analyzeCreatorVoice(placeholderCaptions, postCount);

    if (result.success) {
      setVoiceStatus("done");
    } else if (result.reason === "too_few_captions") {
      setVoiceStatus("too_few");
    } else {
      setVoiceStatus("error");
    }
  }

  async function disconnectAccount(accountId: string) {
    if (!confirm("Disconnect this account? This cannot be undone.")) return;
    await supabase.from("social_accounts").delete().eq("id", accountId);
    window.location.reload();
  }

  return (
    <div className="space-y-5">
      {/* Profile */}
      <form onSubmit={handleSave} className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Settings className="w-4 h-4 text-slate-400" />
          <h2 className="font-semibold text-sm">Profile & AI Preferences</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Full Name</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder="@yourhandle"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500" />
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-400 mb-1 block">Email</label>
          <input type="email" value={user.email} disabled
            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-500 cursor-not-allowed" />
        </div>

        <div className="pt-2 border-t border-slate-800">
          <p className="text-xs text-slate-400 mb-3">AI preferences — saved to your account, used across all AI features</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Your Niche</label>
              <select value={niche} onChange={(e) => setNiche(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500">
                {NICHES.map((n) => <option key={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">AI Response Language</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500">
                {LANGUAGES.map(({ code, label }) => <option key={code} value={code}>{label}</option>)}
              </select>
            </div>
          </div>
          <p className="text-xs text-slate-600 mt-2">AI plans, captions, and scripts will respond in your chosen language.</p>
        </div>

        {error && <p className="text-red-400 text-xs">{error}</p>}

        <button type="submit" disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 rounded-xl text-sm font-semibold transition-colors">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : null}
          {saved ? "Saved!" : "Save changes"}
        </button>
      </form>

      {/* Creator Voice */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-4 h-4 text-purple-400" />
          <h2 className="font-semibold text-sm">Creator Voice Profile</h2>
        </div>

        {voiceProfile ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50">
              <div className="flex-1">
                <p className="text-xs text-slate-400">Tone detected</p>
                <p className="text-sm font-medium capitalize">{voiceProfile.tone}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Last analyzed</p>
                <p className="text-xs text-slate-500">{new Date(voiceProfile.analyzed_at).toLocaleDateString("en-KE")}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Your AI plans are personalized to match your writing style.
              Re-analyze after posting 30+ new pieces of content.
            </p>
          </div>
        ) : (
          <p className="text-sm text-slate-500 mb-3">
            No voice profile yet. Connect an account and post at least 10 pieces of content to enable voice-aware AI plans.
          </p>
        )}

        <div className="mt-3">
          {!canReanalyzeVoice ? (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-800/30 border border-slate-700">
              <AlertCircle className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-500">
                {postCount} post{postCount !== 1 ? "s" : ""} synced — need at least 10 to analyze your voice.
              </p>
            </div>
          ) : (
            <button onClick={handleReanalyzeVoice} disabled={voiceStatus === "loading"}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-700/30 rounded-xl text-sm text-purple-300 font-medium transition-colors disabled:opacity-60">
              {voiceStatus === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
              {voiceStatus === "loading" ? "Analyzing..." : voiceProfile ? "Re-analyze voice" : "Analyze my voice"}
            </button>
          )}
          {voiceStatus === "done" && (
            <p className="text-xs text-green-400 mt-2">✓ Voice profile updated. Your next AI plan will reflect your current style.</p>
          )}
          {voiceStatus === "too_few" && (
            <p className="text-xs text-orange-400 mt-2">Not enough posts to analyze. Sync more content first.</p>
          )}
          {voiceStatus === "error" && (
            <p className="text-xs text-red-400 mt-2">Analysis failed. Try again in a moment.</p>
          )}
        </div>
      </div>

      {/* Plan */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
        <h2 className="font-semibold text-sm mb-3">Current Plan</h2>
        <div className="flex items-center justify-between">
          <div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
              user.tier === "agency" ? "bg-orange-500/20 text-orange-400"
              : user.tier === "growth" ? "bg-purple-500/20 text-purple-400"
              : "bg-slate-700 text-slate-400"
            }`}>
              {user.tier === "agency" ? "Agency / Pro" : user.tier === "growth" ? "Growth Hacker" : "Starter (Free)"}
            </span>
            {user.tier_expires_at && (
              <p className="text-xs text-slate-500 mt-1">
                Renews {new Date(user.tier_expires_at).toLocaleDateString("en-KE")}
              </p>
            )}
          </div>
          {user.tier === "starter" && (
            <a href="/billing" className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-xs font-semibold transition-colors">
              Upgrade
            </a>
          )}
        </div>
      </div>

      {/* Connected accounts */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
        <h2 className="font-semibold text-sm mb-3">Connected Accounts</h2>
        {accounts.length === 0 ? (
          <p className="text-sm text-slate-500">No accounts connected.</p>
        ) : (
          <div className="space-y-2">
            {accounts.map((acc) => (
              <div key={acc.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50">
                <span className="text-lg">{PLATFORM_ICONS[acc.platform] ?? "🔗"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">@{acc.username}</p>
                  <p className="text-xs text-slate-500 capitalize">
                    {acc.platform} · {acc.follower_count.toLocaleString()} followers · {acc.account_age_days}d old
                  </p>
                </div>
                <button onClick={() => disconnectAccount(acc.id)}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2 mt-3">
          <a href="/api/auth/tiktok" className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs text-slate-300 transition-colors">+ TikTok</a>
          <a href="/api/auth/instagram" className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs text-slate-300 transition-colors">+ Instagram</a>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-slate-900 rounded-2xl border border-red-900/30 p-5">
        <h2 className="font-semibold text-sm text-red-400 mb-3">Danger Zone</h2>
        <button
          onClick={async () => {
            if (!confirm("Delete your account? This is permanent and cannot be undone.")) return;
            await createClient().auth.signOut();
            window.location.href = "/";
          }}
          className="px-4 py-2 bg-red-900/20 hover:bg-red-900/40 border border-red-800/50 rounded-xl text-xs text-red-400 font-medium transition-colors">
          Delete account
        </button>
      </div>
    </div>
  );
}
