"use client";

import Link from "next/link";
import {
  ArrowRight,
  TrendingUp,
  Zap,
  BarChart3,
  Shield,
  Globe,
  Sparkles,
  Check,
} from "lucide-react";
import { useTheme } from "@/components/auth/ThemeContext";

export default function HomePage() {
  const { selectedCountry } = useTheme();

  const highlights = [
    "Country-driven onboarding that feels local instantly",
    "Live color mood shifts across auth, landing, and key CTAs",
    "Built for creator economies from Nairobi to New York",
  ];

  return (
    <main className="min-h-screen text-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <div className="flex items-center gap-3">
          <span
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 text-lg shadow-[0_12px_30px_rgba(0,0,0,0.25)]"
            style={{ backgroundColor: "rgba(var(--country-primary-rgb),0.18)" }}
          >
            {selectedCountry.flag}
          </span>
          <div>
            <span className="block text-xl font-semibold tracking-tight">
              CreatorPulse
            </span>
            <span className="block text-xs uppercase tracking-[0.26em] text-white/45">
              Theme: {selectedCountry.name}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/75 transition hover:border-white/20 hover:text-white"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="theme-button-primary rounded-xl px-4 py-2.5 text-sm font-medium"
          >
            Sign up free
          </Link>
        </div>
      </nav>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 pb-18 pt-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <div className="theme-pill inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs uppercase tracking-[0.25em]">
            <Sparkles className="h-3.5 w-3.5" />
            Dynamic country theming is live
          </div>

          <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
            Creator growth,
            <span
              className="block"
              style={{ color: "var(--country-secondary)" }}
            >
              tuned to {selectedCountry.name}
            </span>
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/68">
            Pick a country once and the experience shifts with it. Buttons,
            accents, gradients, and onboarding tone all follow the market you
            want to win.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="theme-button-primary inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-base font-semibold"
            >
              Sign up now <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/login"
              className="theme-button-secondary inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-base font-medium"
            >
              Preview login theme <Globe className="h-5 w-5" />
            </Link>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {highlights.map((item) => (
              <div
                key={item}
                className="theme-surface rounded-2xl px-4 py-4"
              >
                <div
                  className="mb-3 flex h-8 w-8 items-center justify-center rounded-full"
                  style={{ backgroundColor: "rgba(var(--country-primary-rgb),0.18)" }}
                >
                  <Check className="h-4 w-4 text-white" />
                </div>
                <p className="text-sm leading-6 text-white/72">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="theme-surface rounded-[32px] p-5 shadow-[0_25px_80px_rgba(0,0,0,0.35)]">
            <div className="theme-surface-strong rounded-[28px] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-white/45">
                    Active market
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    {selectedCountry.flag} {selectedCountry.name}
                  </h2>
                </div>
                <div
                  className="rounded-2xl border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.24em] text-white/55"
                  style={{ backgroundColor: "rgba(var(--country-secondary-rgb),0.12)" }}
                >
                  Live theme
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                {[
                  ["Primary", selectedCountry.primaryColor],
                  ["Secondary", selectedCountry.secondaryColor],
                  ["Accent", selectedCountry.accentColor],
                ].map(([label, color]) => (
                  <div key={label} className="theme-surface rounded-2xl p-4">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-white/40">
                      {label}
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <span
                        className="h-8 w-8 rounded-full border border-white/10"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-sm text-white/75">{color}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-3">
                {[
                  { icon: TrendingUp, label: "Trend engine tuned for local momentum" },
                  { icon: Zap, label: "AI scripts shaped by region-specific tone" },
                  { icon: Shield, label: "Safer boosts and smarter timing signals" },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="theme-surface flex items-center gap-3 rounded-2xl px-4 py-3"
                  >
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ backgroundColor: "rgba(var(--country-primary-rgb),0.16)" }}
                    >
                      <Icon
                        className="h-4 w-4"
                        style={{ color: "var(--country-secondary)" }}
                      />
                    </span>
                    <span className="text-sm text-white/72">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div
            className="absolute -right-6 top-10 h-28 w-28 rounded-full blur-3xl"
            style={{ backgroundColor: "rgba(var(--country-primary-rgb),0.18)" }}
          />
          <div
            className="absolute -bottom-6 left-6 h-32 w-32 rounded-full blur-3xl"
            style={{ backgroundColor: "rgba(var(--country-secondary-rgb),0.16)" }}
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-white/42">
              Feature stack
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-white">
              Tools that inherit your market mood
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: TrendingUp,
              title: "Trend Engine",
              desc: "Country-aware trend surfaces shaped for creator attention in your selected region.",
            },
            {
              icon: BarChart3,
              title: "Post Heatmap",
              desc: "7×24 posting windows tuned to how your audience behaves where they live.",
            },
            {
              icon: Zap,
              title: "AI Growth Assistant",
              desc: "Action plans that adapt to your niche and the visual tone of your chosen market.",
            },
            {
              icon: Shield,
              title: "Safe SMM Booster",
              desc: "Protection-minded boost flows with better pacing and region-sensitive signals.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="theme-surface rounded-3xl p-5 transition-all duration-500 hover:-translate-y-1 hover:bg-white/7"
              style={{ boxShadow: "0 14px 35px rgba(0,0,0,0.16)" }}
            >
              <div
                className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl"
                style={{ backgroundColor: "rgba(var(--country-primary-rgb),0.16)" }}
              >
                <Icon className="h-5 w-5" style={{ color: "var(--country-secondary)" }} />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{title}</h3>
              <p className="text-sm leading-6 text-white/64">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-24">
        <h2 className="mb-10 text-center text-3xl font-semibold">Simple pricing</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              name: "Starter",
              price: "Free",
              sub: "forever",
              features: ["Global trends", "1 platform", "Basic analytics"],
              cta: "Get started",
              highlight: false,
            },
            {
              name: "Growth Hacker",
              price: "KES 1,950",
              sub: "per month",
              features: [
                "Kenya & Africa trends",
                "AI growth scripts",
                "Post heatmap",
                "2 platforms",
              ],
              cta: "Start growing",
              highlight: true,
            },
            {
              name: "Agency / Pro",
              price: "KES 5,850",
              sub: "per month",
              features: [
                "5 accounts",
                "Competitor tracking",
                "SMM Booster",
                "Priority AI",
              ],
              cta: "Go pro",
              highlight: false,
            },
          ].map((plan) => (
            <div
              key={plan.name}
              className={`rounded-3xl border p-6 transition-all duration-500 ${
                plan.highlight
                  ? "border-white/20"
                  : "bg-white/5 border-white/10"
              }`}
              style={
                plan.highlight
                  ? {
                      background:
                        "linear-gradient(180deg, rgba(var(--country-primary-rgb),0.22), rgba(var(--country-secondary-rgb),0.08))",
                      boxShadow:
                        "0 20px 45px rgba(var(--country-primary-rgb),0.18)",
                    }
                  : undefined
              }
            >
              <p className="mb-1 text-sm text-white/55">{plan.name}</p>
              <p className="mb-0.5 text-3xl font-bold">{plan.price}</p>
              <p className="mb-5 text-xs text-white/45">{plan.sub}</p>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/72">
                    <span style={{ color: "var(--country-secondary)" }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={`block rounded-2xl py-3 text-center text-sm font-medium transition ${
                  plan.highlight ? "theme-button-primary" : ""
                }`}
                style={
                  plan.highlight
                    ? undefined
                    : {
                        backgroundColor: "rgba(255,255,255,0.08)",
                        color: "rgba(255,255,255,0.9)",
                      }
                }
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <footer className="pb-8 text-center text-xs text-white/38">
        © {new Date().getFullYear()} CreatorPulse · Theme currently reflecting{" "}
        {selectedCountry.name}
      </footer>
    </main>
  );
}
