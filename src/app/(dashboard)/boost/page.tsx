"use client";

import { useState } from "react";
import { createBoostOrder, type BoostInput } from "@/lib/smm/boost-action";
import { Zap, AlertTriangle, CheckCircle2, Loader2, Shield } from "lucide-react";

const SERVICE_TYPES = ["likes", "views", "followers", "comments"] as const;

export default function BoostPage() {
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [form, setForm] = useState<Partial<BoostInput>>({
    service_type: "likes",
    quantity: 100,
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.social_account_id || !form.post_url || !form.service_type || !form.quantity) return;

    setLoading(true);
    setResult(null);
    try {
      const res = await createBoostOrder(form as BoostInput);
      setResult({
        success: res.success,
        message: res.success
          ? res.message ?? `Order placed! ${res.currency} ${res.user_pays_local?.toLocaleString()} charged via M-Pesa. Order ID: ${res.order_id?.slice(0, 8)}...`
          : res.error ?? "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  }

  if (!disclaimerAccepted) {
    return (
      <div className="max-w-lg mx-auto pb-20 md:pb-0">
        <div className="bg-slate-900 rounded-2xl border border-orange-700/50 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-orange-400 flex-shrink-0" />
            <h1 className="text-lg font-bold text-orange-300">Important Disclaimer</h1>
          </div>

          <div className="space-y-3 text-sm text-slate-300">
            <p>
              The SMM Booster uses third-party services to deliver social media engagement
              (likes, views, followers, comments).
            </p>
            <p className="font-semibold text-orange-300">
              ⚠️ This may violate the Terms of Service of TikTok, Instagram, Twitter/X, and YouTube.
            </p>
            <ul className="space-y-1.5 text-slate-400">
              <li>• Your account may be shadowbanned or suspended</li>
              <li>• Engagement may not be from real users</li>
              <li>• Results are not guaranteed</li>
              <li>• CreatorPulse is not responsible for platform penalties</li>
            </ul>
            <p>
              We enforce safety limits to minimize risk, but use this feature at your own discretion.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setDisclaimerAccepted(true)}
              className="flex-1 py-3 bg-orange-600 hover:bg-orange-500 rounded-xl text-sm font-semibold transition-colors"
            >
              I understand the risks — Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 pb-20 md:pb-0">
      <div className="flex items-center gap-3">
        <Zap className="w-6 h-6 text-orange-400" />
        <div>
          <h1 className="text-xl font-bold">SMM Booster</h1>
          <p className="text-xs text-slate-500">Agency plan · Safety throttler active</p>
        </div>
      </div>

      {/* Safety + drip-feed info */}
      <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700">
        <Shield className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-slate-400 space-y-0.5">
          <p><span className="text-green-400 font-medium">Safety throttler active.</span> New ≤500 · Growing ≤2,000 · Established ≤10,000. 48h cooldown per post.</p>
          <p><span className="text-blue-400 font-medium">Drip-feed on by default.</span> Engagement delivered gradually over 20 hours — matches natural patterns, reduces shadowban risk.</p>
          <p><span className="text-purple-400 font-medium">Smart routing.</span> Orders route through Smmwiz → JAP → YoYoMedia automatically if a provider fails.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Account ID */}
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Social Account ID</label>
          <input
            type="text"
            placeholder="Paste your social_account_id from dashboard"
            value={form.social_account_id ?? ""}
            onChange={(e) => setForm({ ...form, social_account_id: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
            required
          />
        </div>

        {/* Post URL */}
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Post URL</label>
          <input
            type="url"
            placeholder="https://www.tiktok.com/@user/video/..."
            value={form.post_url ?? ""}
            onChange={(e) => setForm({ ...form, post_url: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
            required
          />
        </div>

        {/* M-Pesa phone */}
        <div>
          <label className="text-xs text-slate-400 mb-1 block">M-Pesa Phone Number</label>
          <input
            type="tel"
            placeholder="2547XXXXXXXX"
            value={form.phone ?? ""}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
            required
          />
          <p className="text-xs text-slate-600 mt-1">You&apos;ll receive an STK Push to confirm payment before the order is placed.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Service type */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Service</label>
            <select
              value={form.service_type}
              onChange={(e) => setForm({ ...form, service_type: e.target.value as BoostInput["service_type"] })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
            >
              {SERVICE_TYPES.map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Quantity</label>
            <input
              type="number"
              min={10}
              max={10000}
              step={10}
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-60 rounded-xl font-semibold transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {loading ? "Processing..." : "Place Boost Order"}
        </button>
      </form>

      {result && (
        <div className={`p-4 rounded-2xl border text-sm ${
          result.success
            ? "bg-green-900/20 border-green-700/30 text-green-300"
            : "bg-red-900/20 border-red-700/30 text-red-300"
        }`}>
          <div className="flex items-start gap-2">
            {result.success
              ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              : <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            }
            {result.message}
          </div>
        </div>
      )}
    </div>
  );
}
