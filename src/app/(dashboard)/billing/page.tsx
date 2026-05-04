"use client";

import { useState } from "react";
import { CreditCard, Smartphone, CheckCircle2, Loader2 } from "lucide-react";
import { useTheme } from "@/components/auth/ThemeContext";

const PLANS = [
  {
    id: "growth",
    name: "Growth Hacker",
    priceKes: 1950,
    priceUsd: 15,
    features: ["Kenya & Africa trends", "AI growth scripts", "Post heatmap", "2 platforms"],
  },
  {
    id: "agency",
    name: "Agency / Pro",
    priceKes: 5850,
    priceUsd: 45,
    features: ["5 accounts", "Competitor tracking", "SMM Booster", "Priority AI"],
  },
];

export default function BillingPage() {
  const { buttonTextColor } = useTheme();
  const [selectedPlan, setSelectedPlan] = useState("growth");
  const [payMethod, setPayMethod] = useState<"mpesa" | "stripe">("mpesa");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleMpesa() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/payments/mpesa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, tier: selectedPlan }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: data.message });
      } else {
        setMessage({ type: "error", text: data.error ?? "Payment failed" });
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleStripe() {
    setLoading(true);
    try {
      const res = await fetch("/api/payments/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: selectedPlan }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setMessage({ type: "error", text: data.error ?? "Stripe error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 md:pb-0">
      <div className="flex items-center gap-3">
        <CreditCard className="w-6 h-6" style={{ color: "var(--country-secondary)" }} />
        <h1 className="text-xl font-bold">Billing & Plans</h1>
      </div>

      {/* Plan selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PLANS.map((plan) => (
          <button
            key={plan.id}
            onClick={() => setSelectedPlan(plan.id)}
            className={`p-4 rounded-2xl border text-left transition-colors ${
              selectedPlan === plan.id
                ? ""
                : "border-slate-700 bg-slate-900 hover:border-slate-600"
            }`}
            style={
              selectedPlan === plan.id
                ? {
                    borderColor: "rgba(var(--country-secondary-rgb),0.24)",
                    backgroundColor: "rgba(var(--country-primary-rgb),0.1)",
                  }
                : undefined
            }
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm">{plan.name}</span>
              {selectedPlan === plan.id && <CheckCircle2 className="w-4 h-4" style={{ color: "var(--country-secondary)" }} />}
            </div>
            <p className="text-xl font-bold">KES {plan.priceKes.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mb-3">/ month · ${plan.priceUsd} USD</p>
            <ul className="space-y-1">
              {plan.features.map((f) => (
                <li key={f} className="text-xs text-slate-400 flex items-center gap-1.5">
                  <span className="text-green-400">✓</span> {f}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      {/* Payment method */}
      <div className="bg-slate-900 rounded-2xl border p-4 space-y-4" style={{ borderColor: "rgba(var(--country-secondary-rgb),0.12)" }}>
        <p className="text-sm font-semibold">Payment Method</p>

        <div className="flex gap-2">
          <button
            onClick={() => setPayMethod("mpesa")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              payMethod === "mpesa"
                ? "text-white"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
            style={
              payMethod === "mpesa"
                ? { backgroundColor: "var(--country-primary)", color: buttonTextColor }
                : undefined
            }
          >
            <Smartphone className="w-4 h-4" /> M-Pesa
          </button>
          <button
            onClick={() => setPayMethod("stripe")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              payMethod === "stripe"
                ? "text-white"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
            style={
              payMethod === "stripe"
                ? { backgroundColor: "var(--country-primary)", color: buttonTextColor }
                : undefined
            }
          >
            <CreditCard className="w-4 h-4" /> Card (Stripe)
          </button>
        </div>

        {payMethod === "mpesa" ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">M-Pesa Phone Number</label>
              <input
                type="tel"
                placeholder="2547XXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-800 border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
                style={{ borderColor: "rgba(var(--country-secondary-rgb),0.16)" }}
              />
              <p className="text-xs text-slate-600 mt-1">Format: 2547XXXXXXXX (no + or spaces)</p>
            </div>
            <button
              onClick={handleMpesa}
              disabled={loading || !phone}
              className="w-full flex items-center justify-center gap-2 py-3 disabled:opacity-60 rounded-xl font-semibold text-sm transition-colors"
              style={{ backgroundColor: "var(--country-primary)", color: buttonTextColor }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
              Pay KES {PLANS.find((p) => p.id === selectedPlan)?.priceKes.toLocaleString()} via M-Pesa
            </button>
          </div>
        ) : (
          <button
            onClick={handleStripe}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 disabled:opacity-60 rounded-xl font-semibold text-sm transition-colors"
            style={{ backgroundColor: "var(--country-primary)", color: buttonTextColor }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
            Pay ${PLANS.find((p) => p.id === selectedPlan)?.priceUsd} USD via Card
          </button>
        )}

        {message && (
          <div className={`p-3 rounded-xl text-sm ${
            message.type === "success"
              ? "bg-green-900/20 border border-green-700/30 text-green-300"
              : "bg-red-900/20 border border-red-700/30 text-red-300"
          }`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}
